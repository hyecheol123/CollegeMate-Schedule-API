/**
 * express Router middleware for Schedule APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import CourseListMetaData from '../datatypes/courseListMetaData/CourseListMetaData';
import BadRequestError from '../exceptions/BadRequestError';
import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../ServerConfig';
import Schedule from '../datatypes/schedule/Schedule';

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
    const termCode = req.body.termCode;
    const termList = await CourseListMetaData.getTermList(dbClient);
    if (!termList.includes(termCode)) {
      throw new BadRequestError();
    }

    // DB Operation: Create a new schedule
    const email = tokenContents.id;
    const requestCreatedDate = new Date();
    const scheduleId = ServerConfig.hash(
      `${email}/${termCode}/${requestCreatedDate.toISOString()}`,
      email,
      termCode,
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

export default scheduleRouter;
