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
  static async deleteCourse(
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

  /**
   * Get all sessions in a course
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} termCode term code of the sessions to be deleted
   * @param {string} courseId course id of the sessions to be deleted
   */
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

  /**
   * Get a list of sessions with the given array of sessionIds for the termCode provided
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} termCode Term code
   * @param {string[]} sessionIds Array of sessionIds
   */
  static async getUserSessions(
    dbClient: Cosmos.Database,
    termCode: string,
    sessionIds: string[]
  ): Promise<Session[]> {
    const sessionList: Session[] = (
      await dbClient
        .container(SESSION)
        .items.query({
          query: `SELECT * FROM c WHERE 
            c.termCode = "${termCode}" AND
            c.id IN (${sessionIds.map(id => `"${id}"`).join(',')})`,
        })
        .fetchAll()
    ).resources;

    return sessionList;
  }

  /**
   * Check if a session exists
   * 
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} sessionId session id
   */
    static async checkExists(
      dbClient: Cosmos.Database,
      sessionId: string
    ): Promise<boolean> {
      const result = await dbClient
          .container(SESSION)
          .item(sessionId)
          .read<Session>()
      
      if (result.statusCode === 404 || result.resource === undefined) {
        return false;
      }
      return true;
    }
}
