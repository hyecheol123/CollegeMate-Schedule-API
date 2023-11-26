/**
 * Define type and used CRUD methods for sessionList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
const SESSION_LIST_META_DATA = 'sessionListMetaData';

export default class SessionListMetaData {
  id: string;
  termCode: string;
  courseId: string;
  hash: string;

  constructor(id: string, termCode: string, courseId: string, hash: string) {
    this.id = id;
    this.termCode = termCode;
    this.courseId = courseId;
    this.hash = hash;
  }

  /**
   * Get the most recent session list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {termCode} termCode term code of the session list meta data to be retrieved
   * @param {string} courseId course id of the session list meta data to be retrieved
   */
  static async get(
    dbClient: Cosmos.Database,
    termCode: string,
    courseId: string
  ): Promise<SessionListMetaData | undefined> {
    const id = `${termCode}-${courseId}`;
    const dbOps = await dbClient
      .container(SESSION_LIST_META_DATA)
      .item(id)
      .read();

    if (dbOps.statusCode === 404) {
      return undefined;
    } else {
      return dbOps.resource as SessionListMetaData;
    }
  }

  /**
   * Create a new session list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {SessionListMetaData} sessionListMetaData session list meta data to be created
   */
  static async create(
    dbClient: Cosmos.Database,
    sessionListMetaData: SessionListMetaData
  ): Promise<void> {
    await dbClient
      .container(SESSION_LIST_META_DATA)
      .items.create(sessionListMetaData);
  }

  /**
   * Update a session list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {SessionListMetaData} sessionListMetaData session list meta data to be updated
   */
  static async update(
    dbClient: Cosmos.Database,
    sessionListMetaData: SessionListMetaData
  ): Promise<void> {
    await dbClient
      .container(SESSION_LIST_META_DATA)
      .item(sessionListMetaData.id)
      .replace(sessionListMetaData);
  }
}
