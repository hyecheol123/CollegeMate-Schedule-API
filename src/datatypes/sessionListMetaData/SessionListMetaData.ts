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
   */
  static async getMostRecent(
    dbClient: Cosmos.Database
  ): Promise<SessionListMetaData | undefined> {
    // if no entries exist, throw not found error
    const dbOps = await dbClient
      .container(SESSION_LIST_META_DATA)
      .items.query(
        `SELECT TOP 1 * FROM ${SESSION_LIST_META_DATA} ORDER BY ${SESSION_LIST_META_DATA}.id DESC`
      )
      .fetchAll();

    if (dbOps.resources.length === 0) {
      return undefined;
    } else {
      return dbOps.resources[0];
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
