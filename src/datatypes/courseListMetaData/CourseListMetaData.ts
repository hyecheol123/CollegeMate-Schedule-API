/**
 * Define type and used CRUD methods for courseList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
const COURSE_LIST_META_DATA = 'courseListMetaData';

export default class CourseListMetaData {
  id: string;
  hash: string;
  lastChecked: Date | string;

  /**
   * Constructor for CourseListMetaData
   *
   * @param {string} id Term Code
   * @param {string} hash Hash of the course list
   * @param {Date | string} lastChecked Last time the course list was updated
   */
  constructor(id: string, hash: string, lastChecked: Date | string) {
    this.id = id;
    this.hash = hash;
    this.lastChecked = lastChecked;
  }

  /**
   * Get the most recent course list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   */
  static async getMostRecent(
    dbClient: Cosmos.Database
  ): Promise<CourseListMetaData | undefined> {
    // if no entries exist, throw not found error
    const dbOps = await dbClient
      .container(COURSE_LIST_META_DATA)
      .items.query(
        `SELECT TOP 1 * FROM ${COURSE_LIST_META_DATA} ORDER BY ${COURSE_LIST_META_DATA}.lastChecked DESC`
      )
      .fetchAll();

    if (dbOps.resources.length === 0) {
      return undefined;
    } else {
      return dbOps.resources[0];
    }
  }

  /**
   * Create a new course list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   *
   */
  static async create(
    dbClient: Cosmos.Database,
    id: string,
    hash: string
  ): Promise<void> {
    const courseListMetaData = new CourseListMetaData(
      id,
      hash,
      new Date().toISOString()
    );
    await dbClient
      .container(COURSE_LIST_META_DATA)
      .items.create(courseListMetaData);
  }

  /**
   * Update a course list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {id} id Term Code
   * @param {hash} hash Hash of the course list
   */
  static async update(
    dbClient: Cosmos.Database,
    id: string,
    hash: string
  ): Promise<void> {
    const courseListMetaData = new CourseListMetaData(
      id,
      hash,
      new Date().toISOString()
    );

    await dbClient
      .container(COURSE_LIST_META_DATA)
      .item(courseListMetaData.id)
      .replace(courseListMetaData);
  }
}
