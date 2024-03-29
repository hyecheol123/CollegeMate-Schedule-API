/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../ServerConfig';
import Schedule from '../datatypes/schedule/Schedule';
import {validateCreateScheduleRequest} from '../functions/inputValidator/validateCreateScheduleRequest';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyServerAdminToken from '../functions/JWT/verifyServerAdminToken';
import {validateCourseListUpdateRequest} from '../functions/inputValidator/validateCourseListUpdateRequest';
import BadRequestError from '../exceptions/BadRequestError';
import CourseListUpdateRequestObj from '../datatypes/course/CourseListUpdateRequestObj';
import CourseListMetaData from '../datatypes/courseListMetaData/CourseListMetaData';
import ConflictError from '../exceptions/ConflictError';
import courseListCrawler from '../functions/crawlers/courseListCrawler';
import Course from '../datatypes/course/Course';
import sessionListCrawler from '../functions/crawlers/sessionListCrawler';
import Session from '../datatypes/session/Session';
import SessionListMetaData from '../datatypes/sessionListMetaData/SessionListMetaData';
import ForbiddenError from '../exceptions/ForbiddenError';
// import ServerConfig from '../ServerConfig';

// Path: /schedule
const scheduleRouter = express.Router();

// POST: /schedule
scheduleRouter.post('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Header check - access token
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    const tokenContents = verifyAccessToken(
      accessToken,
      req.app.get('jwtAccessKey')
    );

    // Validate termCode
    if (
      !validateCreateScheduleRequest(req.body) ||
      !(await CourseListMetaData.get(dbClient, req.body.termCode))
    ) {
      throw new BadRequestError();
    }
    const termCode = req.body.termCode;

    // Check if the user already has a schedule for the term
    const email = tokenContents.id;
    if (await Schedule.checkExists(dbClient, email, termCode)) {
      throw new ConflictError();
    }
    // DB Operation: Create a new schedule
    const requestCreatedDate = new Date();
    const scheduleId = ServerConfig.hash(
      `${email}/${termCode}/${requestCreatedDate.toISOString()}`,
      email,
      termCode
    );
    const schedule = {
      id: scheduleId,
      email: email,
      termCode: termCode,
      sessionList: [],
      eventList: [],
    };
    await Schedule.create(dbClient, schedule);

    // Response
    res.status(201).json({
      scheduleId: scheduleId,
    });
  } catch (e) {
    next(e);
  }
});

// POST: /schedule/course-list/:termCode/update
scheduleRouter.post('/course-list/:termCode/update', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Header check - serverAdminToken
    const serverAdminToken = req.header('X-SERVER-TOKEN');
    if (serverAdminToken === undefined) {
      throw new UnauthenticatedError();
    }
    verifyServerAdminToken(serverAdminToken, req.app.get('jwtAccessKey'));

    // Check forceUpdate tag from request json
    if (
      !validateCourseListUpdateRequest(req.body as CourseListUpdateRequestObj)
    ) {
      throw new BadRequestError();
    }

    // Check if the course list has been updated within 12 hours if forceUpdate is false
    const termCode = req.params.termCode;
    const courseListMetaData: CourseListMetaData | undefined =
      await CourseListMetaData.get(dbClient, termCode);
    const currentTime = new Date();
    if (courseListMetaData) {
      const lastChecked = new Date(courseListMetaData.lastChecked);
      const timeDiff = currentTime.getTime() - lastChecked.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      if (hoursDiff < 12 && !req.body.forceUpdate) {
        throw new ConflictError();
      }
    }

    // Response - WebScraping might take a long time
    res.status(202).send();

    // Crawl and update course list and session list
    const courseList: Course[] = await courseListCrawler(termCode);
    // Compare Hash
    const courseListHash = ServerConfig.hash(
      termCode,
      termCode,
      JSON.stringify(courseList)
    );

    // If the course list has not been updated, update lastChecked and return
    if (courseListMetaData && courseListHash === courseListMetaData.hash) {
      courseListMetaData.lastChecked = currentTime;
      await CourseListMetaData.update(dbClient, termCode, courseListHash);
    } else {
      const previousCourseList: string[] = await Course.getAll(
        dbClient,
        termCode
      );
      // Delete all courses in the term
      await Course.deleteAll(dbClient, termCode);
      // Create new courses
      for (const course of courseList) {
        await Course.create(dbClient, course);
      }
      // Update course list meta data
      if (!courseListMetaData) {
        await CourseListMetaData.create(dbClient, termCode, courseListHash);
      } else {
        courseListMetaData.hash = courseListHash;
        courseListMetaData.lastChecked = currentTime;
        await CourseListMetaData.update(dbClient, termCode, courseListHash);
        // Before crawling session list, remove all sessions removed from the previous course list
        const courseToBeDeleted: string[] = previousCourseList.filter(
          courseId =>
            !courseList.map(course => course.courseId).includes(courseId)
        );
        for (const courseId of courseToBeDeleted) {
          await Session.deleteCourse(dbClient, courseId);
        }
      }
    }

    // For each course, update session list and its meta data if courseListHash is different
    let i = 10;
    for (const course of courseList) {
      // Crawl and update session list
      const sessionList: Session[] = await sessionListCrawler(
        termCode,
        course.subjectCode,
        course.courseId
      );
      // Compare Hash
      const sessionListHash = ServerConfig.hash(
        termCode,
        course.courseId,
        JSON.stringify(sessionList)
      );
      const sessionListMetaData: SessionListMetaData | undefined =
        await SessionListMetaData.get(dbClient, termCode, course.courseId);
      if (sessionListMetaData && sessionListHash === sessionListMetaData.hash) {
        continue;
      }
      // Delete all sessions in the course
      await Session.deleteCourse(dbClient, course.courseId);
      // Create new sessions
      for (const session of sessionList) {
        await Session.create(dbClient, session);
      }
      // Update session list meta data
      if (!sessionListMetaData) {
        const newSessionListMetaData = new SessionListMetaData(
          course.id,
          termCode,
          course.courseId,
          sessionListHash
        );
        await SessionListMetaData.create(dbClient, newSessionListMetaData);
      } else {
        sessionListMetaData.hash = sessionListHash;
        await SessionListMetaData.update(dbClient, sessionListMetaData);
      }
      // To prevent from being blocked by the server, wait 1 second every 10 courses
      i--;
      if (i === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        i = 10;
      }
    }
  } catch (e) {
    next(e);
  }
});

// GET: /schedule/available-semesters
scheduleRouter.get('/available-semesters', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;
  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    const termList = await CourseListMetaData.getTermList(dbClient);
    res.json(termList);
  } catch (e) {
    next(e);
  }
});

export default scheduleRouter;
