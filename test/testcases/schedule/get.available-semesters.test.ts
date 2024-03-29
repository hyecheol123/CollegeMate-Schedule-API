/**
 * Jest Unit test for GET /schedule/available-semesters method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';

const COURSE_LIST_META_DATA = 'courseListMetaData';
describe('GET /schedule/available-semesters - Get Available Semesters', () => {
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
      .get('/schedule/available-semesters')
      .set({Origin: 'https://suspicious.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Wrong App Version
    response = await request(testEnv.expressServer.app)
      .get('/schedule/available-semesters')
      .set({'X-APPLICATION-KEY': '<Android-App-v2>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // No Origin
    response = await request(testEnv.expressServer.app).get(
      '/schedule/available-semesters'
    );
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get('/schedule/available-semesters')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toBe('1242');
    expect(response.body[1]).toBe('1244');

    // DB check
    let termList = (
      await testEnv.dbClient
        .container(COURSE_LIST_META_DATA)
        .items.query({
          query: 'SELECT c.termCode FROM c',
        })
        .fetchAll()
    ).resources.map((term: {termCode: string}) => term.termCode);

    expect(termList).toEqual(['1242', '1244']);
    expect(termList.length).toBe(2);
    expect(response.body).toEqual(termList);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toBe('1242');
    expect(response.body[1]).toBe('1244');

    // Request From Android App
    response = await request(testEnv.expressServer.app)
      .get('/schedule/available-semesters')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toBe('1242');
    expect(response.body[1]).toBe('1244');

    // DB check
    termList = (
      await testEnv.dbClient
        .container(COURSE_LIST_META_DATA)
        .items.query({
          query: 'SELECT c.termCode FROM c',
        })
        .fetchAll()
    ).resources.map((term: {termCode: string}) => term.termCode);

    expect(termList).toEqual(['1242', '1244']);
    expect(termList.length).toBe(2);
    expect(response.body).toEqual(termList);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toBe('1242');
    expect(response.body[1]).toBe('1244');
  });
});
