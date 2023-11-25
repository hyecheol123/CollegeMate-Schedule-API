/**
 * Jest Unit test for GET /schedule/course method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import test from 'node:test';

const COURSE_LIST_META_DATA = 'courseListMetaData';

describe('GET /schedule/course - Course Search', () => {
    let testEnv: TestEnv;
  
    beforeEach(async () => {
      testEnv = new TestEnv(expect.getState().currentTestName as string);
      // Start Test Environment
      await testEnv.start();
    });
  
    afterEach(async () => {
      await testEnv.stop();
    });

    test('Fail - Neither from Origin or App', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
    
        // Wrong Origin
        let response = await request(testEnv.expressServer.app)
          .get('/schedule/course')
          .set({Origin: 'https://suspicious.app'});
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
    
        // Wrong App Version
        response = await request(testEnv.expressServer.app)
          .get('/schedule/course')
          .set({'X-APPLICATION-KEY': '<Android-App-v2>'});
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
    
        // No Origin
        response = await request(testEnv.expressServer.app)
            .get('/schedule/course');
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
    });

    test('Fail - Bad Request', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;

        // Without request body
        let response = await request(testEnv.expressServer.app)
            .get('/schedule/course')
            .set({Origin: 'https://collegemate.app'})
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');

        // Request with invalid request body property
        response = await request(testEnv.expressServer.app)
            .get('/schedule/course')
            .set({Origin: 'https://collegemate.app'})
            .send({
                invalidPropertity: 'invalidValue',
                invalidProperty2: 'invalidValue2',
            });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');

        // Request with invalid request body
        response = await request(testEnv.expressServer.app)
        .get('/schedule/course')
        .set({Origin: 'https://collegemate.app'})
        .send({
            termCode: '0000',
            courseName: 'CS 300',
        });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
    });

    test('Success', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
        testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    
        // Request From Web
        let response = await request(testEnv.expressServer.app)
          .get('/schedule/course')
          .set({Origin: 'https://collegemate.app'})
          .send({
            invalidPropertity: 'invalidValue',
            invalidProperty2: 'invalidValue2',
        });
        expect(response.status).toBe(200);
    
    
    
        // Request From Android App
        response = await request(testEnv.expressServer.app)
          .get('/schedule/course')
          .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
          .send({
            invalidPropertity: 'invalidValue',
            invalidProperty2: 'invalidValue2',
        });
        expect(response.status).toBe(200);
        
    });
});