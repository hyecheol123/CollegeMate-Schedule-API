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
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import Schedule from '../datatypes/schedule/Schedule';
import NotFoundError from '../exceptions/NotFoundError';

const scheduleRouter = express.Router();

// GET: /schedule/{scheduleId}
scheduleRouter.get('/:scheduleId', async (req, res, next) => {
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

      // const tokenContents = verifyAccessToken(
      //   accessToken,
      //   req.app.get('jwtAccessKey')
      // );
      // const email = tokenContents.id;
      const scheduleId = req.params.scheduleId;

      if (!await Schedule.findExist(dbClient, scheduleId)) {
        throw new NotFoundError();
      }

      const scheduleDetail = await Schedule.findScheduleDetail(dbClient, scheduleId);

      // Response
      res.status(200).send(scheduleDetail);
    } catch (e) {
        next(e);
    }
});

export default scheduleRouter;
