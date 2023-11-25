/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../ServerConfig';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import CourseListMetaData from '../datatypes/courseListMetaData/CourseListMetaData';

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
      const courseList= await CourseListMetaData.searchCourse(dbClient, termCode, courseName);

      res.status(200).json(courseList);
    }
    catch (e) {
      next(e);
    }
});

export default scheduleRouter;
