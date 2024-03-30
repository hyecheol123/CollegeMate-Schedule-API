/**
 * Define type and used CRUD methods for schedule
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';

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
   * Check if the schedule with the email exists in the database
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} email User's email
   */
  static async confirmExists(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<boolean> {
    const dbOps = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: `SELECT * FROM c WHERE c.email = "${email}"`,
      })
      .fetchAll();
    return dbOps.resources.length !== 0;
  }

  /**
   * Retrieve list of schedule associated with the user idenfied by the given email address (base64urlsafe encoded).
   *
   * @param dbClient Cosmos DB client
   * @param email base64urlsafe encoded email address
   */
  static async retrieveScheduleList(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<string[]> {
    const dbOps = await dbClient
      .container(SCHEDULE)
      .items.query({
        query: `SELECT * FROM c WHERE c.email = "${email}"`,
      })
      .fetchAll();

    return dbOps.resources.map((schedule: Schedule) => schedule.id);
  }
}
