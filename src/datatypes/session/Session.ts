/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
const SESSION = 'session';

export interface Meeting {
  buildingName: string | undefined;
  room: string | undefined;
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
    campusId: string | undefined;
    email: string;
    name: {
      first: string;
      middle: string | undefined;
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
  topic: string | undefined;

  constructor(
    id: string,
    courseId: string,
    termCode: string,
    sessionId: string,
    meetings: Meeting[],
    credit: number,
    isAsyncronous: boolean,
    onlineOnly: boolean,
    topic: string | undefined
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

  /**
   * Create a new session
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {Session} session session to be created
   */
  static async create(
    dbClient: Cosmos.Database,
    session: Session
  ): Promise<void> {
    await dbClient.container(SESSION).items.create(session);
  }

  /**
   * Delete all sessions in a course
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} courseId course id of the sessions to be deleted
   */
  static async deleteAll(
    dbClient: Cosmos.Database,
    courseId: string
  ): Promise<void> {
    const dbOps = await dbClient
      .container(SESSION)
      .items.query({
        query: `SELECT * FROM ${SESSION} s WHERE s.courseId = @courseId`,
        parameters: [
          {
            name: '@courseId',
            value: courseId,
          },
        ],
      })
      .fetchAll();

    for (const session of dbOps.resources) {
      await dbClient.container(SESSION).item(session.id).delete();
    }
  }
}
