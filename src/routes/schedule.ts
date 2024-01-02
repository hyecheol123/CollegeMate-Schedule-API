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
import NotFoundError from '../exceptions/NotFoundError';
import { validateEmail } from '../functions/inputValidator/validateEmail';
import Schedule from '../datatypes/schedule/Schedule';
import { request } from 'http';

const scheduleRouter = express.Router();

// GET: /schedule/{base64Email}/list
scheduleRouter.get('/:base64Email/list', async (req, res, next) => {
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

        // Parameter check if received
        const requestUserEmail = Buffer.from(
            req.params.base64Email,
            'base64url'
        ).toString('utf8');

        if (requestUserEmail !== tokenContents.id) {
            throw new ForbiddenError();
        }

        if (!validateEmail(requestUserEmail)) {
            throw new NotFoundError();
        }

        // DB Operation
        const email = tokenContents.id;
        const scheduleList = await Schedule.retrieveScheduleList(dbClient, email);

        res.status(200).send(scheduleList);

    } catch (e) {
        next(e);
    }
});

export default scheduleRouter;
