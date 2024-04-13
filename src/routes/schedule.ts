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
import CourseSearchGetResponseObj from '../datatypes/course/CourseSearchGetResponseObj';
import {validateCourseSearchRequest} from '../functions/inputValidator/validateCourseSearchRequest';
import IScheduleUpdateObj from '../datatypes/schedule/IScheduleUpdateObj';
import NotFoundError from '../exceptions/NotFoundError';
import SessionEditRequestObj from '../datatypes/session/SessionEditRequestObj';
import {validateSessionEditRequest} from '../functions/inputValidator/validateSessionEditRequest';
import timeConflictChecker, {
  TimeRange,
} from '../functions/utils/timeConflictChecker';

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

// DELETE: /schedule/:scheduleId
scheduleRouter.delete('/:scheduleId', async (req, res, next) => {
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

    // Validate scheduleId
    const scheduleId = req.params.scheduleId;
    const email = tokenContents.id;
    const schedule = await Schedule.read(dbClient, scheduleId);
    if (schedule.email !== email) {
      throw new ForbiddenError();
    }

    // DB Operation: Delete the schedule
    await Schedule.delete(dbClient, scheduleId);

    // Response
    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

// PATCH: /schedule/:scheduleId/event/:eventId
scheduleRouter.patch('/:scheduleId/event/:eventId', async (req, res, next) => {
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

    // Validate request body
    if (!validateSessionEditRequest(req.body as SessionEditRequestObj)) {
      throw new BadRequestError();
    }
    // Check if the time has been changed
    const timeChanged = req.body.startTime || req.body.endTime;

    // Check if the user has access to the schedule
    const email = tokenContents.id;
    const scheduleId = req.params.scheduleId;
    const schedule = await Schedule.read(dbClient, scheduleId);
    if (schedule.email !== email) {
      throw new ForbiddenError();
    }

    // Check and edit schedule event/session
    let scheduleUpdateObj: IScheduleUpdateObj = {};
    if (
      schedule.eventList.filter(event => event.id === req.params.eventId)
        .length !== 0
    ) {
      scheduleUpdateObj = {
        eventList: schedule.eventList.map(event => {
          if (event.id === req.params.eventId) {
            return {
              id: event.id,
              title: req.body.title ? req.body.title : event.title,
              location: req.body.location ? req.body.location : event.location,
              meetingDaysList: req.body.meetingDaysList
                ? req.body.meetingDaysList
                : event.meetingDaysList,
              startTime: req.body.startTime
                ? req.body.startTime
                : event.startTime,
              endTime: req.body.endTime ? req.body.endTime : event.endTime,
              memo: req.body.memo ? req.body.memo : event.memo,
              colorCode: req.body.colorCode
                ? req.body.colorCode
                : event.colorCode,
            };
          } else {
            return event;
          }
        }),
      };
    } else if (
      schedule.sessionList.filter(session => session.id === req.params.eventId)
        .length !== 0
    ) {
      scheduleUpdateObj = {
        sessionList: schedule.sessionList.map(session => {
          if (session.id === req.params.eventId) {
            return {
              id: req.body.sessionId ? req.body.sessionId : session.id,
              colorCode: req.body.colorCode
                ? req.body.colorCode
                : session.colorCode,
            };
          } else {
            return session;
          }
        }),
      };
    } else {
      throw new NotFoundError();
    }

    // Check for conflicting events or sessions in the schedule
    const sessionList = await Session.getUserSessions(
      dbClient,
      schedule.termCode,
      schedule.sessionList.map(session => session.id)
    );
    const eventList = schedule.eventList;
    // combine all events and sessions time range
    const allEvents: TimeRange[] = sessionList
      .map(session => {
        return session.meetings
          .filter(meeting => {
            return meeting.meetingType !== 'EXAM';
          })
          .map(meeting => {
            return {
              meetingDaysList: meeting.meetingDaysList,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
            };
          });
      })
      .flat()
      .concat(
        eventList.map(event => {
          return {
            meetingDaysList: event.meetingDaysList,
            startTime: event.startTime,
            endTime: event.endTime,
          };
        })
      );

    // check if there is any time conflict
    if (timeChanged)
      if (timeConflictChecker(allEvents)) throw new ConflictError();

    // DB Operation: Update the schedule
    await Schedule.update(dbClient, scheduleId, scheduleUpdateObj);

    // Response
    res.status(200).send();
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

// DELETE: /schedule/:scheduleId/event/:eventId
scheduleRouter.delete('/:scheduleId/event/:eventId', async (req, res, next) => {
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

    // Check if the user has access to the schedule
    const email = tokenContents.id;
    const scheduleId = req.params.scheduleId;
    const schedule = await Schedule.read(dbClient, scheduleId);
    if (schedule.email !== email) {
      throw new ForbiddenError();
    }

    // Check and create new event or session list to update\
    let scheduleUpdateObj: IScheduleUpdateObj = {};
    if (
      schedule.eventList.filter(event => event.id === req.params.eventId)
        .length !== 0
    ) {
      scheduleUpdateObj = {
        eventList: schedule.eventList.filter(
          event => event.id !== req.params.eventId
        ),
      };
    } else if (
      schedule.sessionList.filter(session => session.id === req.params.eventId)
        .length !== 0
    ) {
      scheduleUpdateObj = {
        sessionList: schedule.sessionList.filter(
          session => session.id !== req.params.eventId
        ),
      };
    } else {
      throw new NotFoundError();
    }

    // DB Operation: Update the schedule
    await Schedule.update(dbClient, scheduleId, scheduleUpdateObj);

    // Response
    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

// GET: /schedule/course
scheduleRouter.get('/course', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Check request body for all required fields
    if (!validateCourseSearchRequest(req.body)) {
      throw new BadRequestError();
    }

    const termCode = req.body.termCode;
    const courseName = req.body.courseName;
    const courseList = await Course.getCourse(dbClient, termCode, courseName);

    if (courseList.length === 0) {
      res.status(200).json({
        found: false,
      });
      return;
    }

    const courseId = courseList[0].courseId;

    const sessions = await Session.getAllSessions(dbClient, termCode, courseId);

    const courseSearch: CourseSearchGetResponseObj = {
      found: true,
      result: {
        courseId: courseList[0].courseId,
        courseName: courseList[0].courseName,
        description: courseList[0].description,
        fullCourseName: courseList[0].fullCourseName,
        title: courseList[0].title,
        sessionList: sessions.map(session => {
          return {
            id: session.id,
            sessionId: session.sessionId,
            meetings: session.meetings.map(meeting => {
              return {
                buildingName: meeting.buildingName,
                room: meeting.room,
                meetingDaysList: meeting.meetingDaysList,
                meetingType: meeting.meetingType,
                startTime: {
                  month: meeting.startTime.month,
                  day: meeting.startTime.day,
                  hour: meeting.startTime.hour,
                  min: meeting.startTime.minute,
                },
                endTime: {
                  month: meeting.endTime.month,
                  day: meeting.endTime.day,
                  hour: meeting.endTime.hour,
                  min: meeting.endTime.minute,
                },
                instructors: meeting.instructors,
              };
            }),
            credits: session.credit,
            isAsynchronous: session.isAsyncronous,
            onlineOnly: session.onlineOnly,
          };
        }),
      },
    };

    res.status(200).json(courseSearch);
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
      /* istanbul ignore next */
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
