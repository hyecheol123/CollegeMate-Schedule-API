/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../ServerConfig';
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

// Path: /schedule
const scheduleRouter = express.Router();

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
    const courseListMetaData: CourseListMetaData | undefined =
      await CourseListMetaData.getMostRecent(dbClient);
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
    const termCode = req.params.termCode;
    const courseList: Course[] = await courseListCrawler(termCode);
    // Compare Hash
    const courseListHash = ServerConfig.hash(
      termCode,
      termCode,
      JSON.stringify(courseList)
    );
    if (courseListMetaData && courseListHash === courseListMetaData.hash) {
      return;
    }
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
        await SessionListMetaData.getMostRecent(dbClient);
      if (sessionListMetaData && sessionListHash === sessionListMetaData.hash) {
        continue;
      }
      // Delete all sessions in the course
      await Session.deleteAll(dbClient, course.courseId);
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

export default scheduleRouter;
