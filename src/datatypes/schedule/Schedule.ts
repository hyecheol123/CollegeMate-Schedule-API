/**
 * Define type and used CRUD methods for schedule
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';
import IScheduleUpdateObj from './IScheduleUpdateObj';

// DB Container id
const SCHEDULE = 'schedule';

export interface Event {
  id: string;
  title: string;
  location: string | undefined;
  meetingDaysList: string[];
  startTime: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  endTime: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  memo: string;
  colorCode: number;
}

export default class Schedule {
  id: string;
  email: string;
  termCode: string;
  sessionList: {
    id: string;
    colorCode: number;
  }[];
  eventList: Event[];

  constructor(
    id: string,
    email: string,
    termCode: string,
    sessionList: {
      id: string;
      colorCode: number;
    }[],
    eventList: Event[]
  ) {
    this.id = id;
    this.email = email;
    this.termCode = termCode;
    this.sessionList = sessionList;
    this.eventList = eventList;
  }

  /**
   * Create a new schedule
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {Schedule} schedule Schedule object to create
   */
  static async create(
    dbClient: Cosmos.Database,
    schedule: Schedule
  ): Promise<void> {
    await dbClient.container(SCHEDULE).items.create(schedule);
  }

  /**
   * Read a schedule with the id provided
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id Schedule id
   */
  static async read(dbClient: Cosmos.Database, id: string): Promise<Schedule> {
    const dbOps = await dbClient.container(SCHEDULE).item(id).read<Schedule>();
    if (dbOps.statusCode === 404 || dbOps.resource === undefined) {
      throw new NotFoundError();
    }
    return new Schedule(
      dbOps.resource.id,
      dbOps.resource.email,
      dbOps.resource.termCode,
      dbOps.resource.sessionList,
      dbOps.resource.eventList
    );
  }

  /**
   * Delete a schedule with the id provided
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id Schedule id
   */
  static async delete(dbClient: Cosmos.Database, id: string): Promise<void> {
    try {
      await dbClient.container(SCHEDULE).item(id).delete();
    } catch (e) {
      // istanbul ignore next
      if ((e as Cosmos.ErrorResponse).code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }

  /**
   * Check if the schedule with the email and termCode exists in the database
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} email User's email
   * @param {string} termCode Term code
   */
  static async checkExists(
    dbClient: Cosmos.Database,
    email: string,
    termCode: string
  ): Promise<boolean> {
    const dbOps = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: `SELECT * FROM c WHERE c.email = "${email}" AND c.termCode = "${termCode}"`,
      })
      .fetchAll();
    return dbOps.resources.length !== 0;
  }

  /**
   * Update a schedule with the id provided
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id Schedule id
   * @param {ISessionUpdateObj} sessionUpdateObj Session update object
   */
  static async update(
    dbClient: Cosmos.Database,
    id: string,
    scheduleUpdateObj: IScheduleUpdateObj
  ): Promise<void> {
    const updateOps: Cosmos.PatchOperation[] = [];
    if (scheduleUpdateObj.eventList) {
      updateOps.push({
        op: 'replace',
        path: '/eventList',
        value: scheduleUpdateObj.eventList,
      });
    }
    if (scheduleUpdateObj.sessionList) {
      updateOps.push({
        op: 'replace',
        path: '/sessionList',
        value: scheduleUpdateObj.sessionList,
      });
    }

    const dbOps = await dbClient.container(SCHEDULE).item(id).patch(updateOps);
    // istanbul ignore if
    if (dbOps.statusCode === 404 || dbOps.resource === undefined) {
      throw new NotFoundError();
    }
  }
}
