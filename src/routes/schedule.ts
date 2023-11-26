/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../ServerConfig';
import ForbiddenError from '../exceptions/ForbiddenError';
import Course from '../datatypes/course/Course';
import Session from '../datatypes/session/Session';
import CourseSearchGetResponseObj from '../datatypes/course/CourseSearchGetResponseObj';

const scheduleRouter = express.Router();

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

    const termCode = req.body.termCode;
    const courseName = req.body.courseName;
    const courseList = await Course.getCourse(dbClient, termCode, courseName);
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

    console.log(courseSearch);
    console.log(courseSearch.result.sessionList);

    res.status(200).json(courseSearch);
  } catch (e) {
    next(e);
  }
});

export default scheduleRouter;
