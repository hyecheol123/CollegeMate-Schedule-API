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
   * @param {id} id Term Code
   */
  static async get(
    dbClient: Cosmos.Database,
    id: string
  ): Promise<CourseListMetaData | undefined> {
    const dbOps = await dbClient
      .container(COURSE_LIST_META_DATA)
      .item(id)
      .read();

    if (dbOps.statusCode === 404) {
      return undefined;
    } else {
      return dbOps.resource as CourseListMetaData;
    }
  }
}
