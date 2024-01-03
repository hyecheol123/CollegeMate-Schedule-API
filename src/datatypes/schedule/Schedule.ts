/**
 * Define type and used CRUD methods for schedule
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../../ServerConfig';

// DB Container id
const SCHEDULE = 'schedule';

interface Event {
  id: string;
  title: string;
  location: string;
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
   * check if the schedule with the id exists in the database
   * 
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id schedule id
   */
  static async findExist(
    dbClient: Cosmos.Database,
    id: string,
  ): Promise<boolean> {
    const dbOps = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: `SELECT * FROM c WHERE c.id = "${id}"`,
      })
    .fetchAll();
    return dbOps.resources.length !== 0;
  }

  /**
   * find the detail of the schedule
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id schedule id
   */
  static async findScheduleDetail(
    dbClient: Cosmos.Database,
    id: string,
  ): Promise<Schedule> {
    const schedule = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: `SELECT * FROM c WHERE c.id = "${id}"`,
      })
    .fetchAll();
    return schedule.resources[0];
  }
}
