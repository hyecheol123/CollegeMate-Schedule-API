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
   * Retrieve list of schedule associated with the user idenfied by the given email address (base64urlsafe encoded).
   * 
   * @param dbClient Cosmos DB client
   * @param email base64urlsafe encoded email address
   */
  static async retrieveScheduleList(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<Schedule[]> {
    const querySpec: Cosmos.SqlQuerySpec = {
      query: `SELECT * FROM c WHERE c.email = @email`,
      parameters: [
        {
          name: '@email',
          value: email,
        },
      ],
    };

    const { resources: scheduleList } = await dbClient
      .container(SCHEDULE)
      .items.query(querySpec)
      .fetchAll();

    return scheduleList as Schedule[];
  }
}
