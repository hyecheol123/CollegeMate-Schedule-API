/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import ForbiddenError from '../exceptions/ForbiddenError';
import CourseListMetaData from '../datatypes/courseListMetaData/CourseListMetaData';
// import ServerConfig from '../ServerConfig';

const scheduleRouter = express.Router();

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
