/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
const SESSION = 'session';

export interface Meeting {
  buildingName?: string;
  room?: string;
  meetingDaysList: string[];
  meetingType: string;
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
  instructors: {
    campusId?: string;
    email: string;
    name: {
      first: string;
      middle?: string;
      last: string;
    };
  }[];
}

export default class Session {
  id: string;
  courseId: string;
  termCode: string;
  sessionId: string;
  meetings: Meeting[];
  credit: number;
  isAsyncronous: boolean;
  onlineOnly: boolean;
  topic?: string;

  constructor(
    id: string,
    courseId: string,
    termCode: string,
    sessionId: string,
    meetings: Meeting[],
    credit: number,
    isAsyncronous: boolean,
    onlineOnly: boolean,
    topic?: string
  ) {
    this.id = id;
    this.courseId = courseId;
    this.termCode = termCode;
    this.sessionId = sessionId;
    this.meetings = meetings;
    this.credit = credit;
    this.isAsyncronous = isAsyncronous;
    this.onlineOnly = onlineOnly;
    this.topic = topic;
  }

  static async getAllSessions(
    dbClient: Cosmos.Database,
    termCode: string,
    courseId: string
  ): Promise<Session[]> {
    // Get courseList from DB with the corresponding termCode and courseName
    const sessionList: Session[] = (
      await dbClient
        .container(SESSION)
        .items.query({
          query:
            'SELECT * FROM c WHERE c.termCode = @termCode AND c.courseId = @courseId',
          parameters: [
            {
              name: '@termCode',
              value: termCode,
            },
            {
              name: '@courseId',
              value: courseId,
            },
          ],
        })
        .fetchAll()
    ).resources;

    return sessionList;
  }
}
