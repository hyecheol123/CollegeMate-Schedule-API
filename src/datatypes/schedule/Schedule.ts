/**
 * Define type and used CRUD methods for schedule
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
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
  termCode: string;
  sessionList: {
    id: string;
    colorCode: number;
  }[];
  eventList: Event[];

  constructor(
    id: string,
    termCode: string,
    sessionList: {
      id: string;
      colorCode: number;
    }[],
    eventList: Event[]
  ) {
    this.id = id;
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

  /**
   * Retrieve list of all schedule IDs
   *
   * @param dbClient Cosmos DB client
   */
  static async retrieveAllScheduleIds(
    dbClient: Cosmos.Database
  ): Promise<string[]> {
    const dbOps = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: 'SELECT c.id FROM c',
      })
      .fetchAll();

    return dbOps.resources.map(item => item.id);
  }
}
