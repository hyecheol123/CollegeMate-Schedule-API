/**
 * Define type and used CRUD methods for courseList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
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

  /**
   * Create a new course list meta data
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {id} id Term Code
   * @param {hash} hash Hash of the course list
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

  /**
   * Get a list of all available terms
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   */
  static async getTermList(dbClient: Cosmos.Database): Promise<string[]> {
    return (
      await dbClient
        .container(COURSE_LIST_META_DATA)
        .items.query({
          query: 'SELECT c.id FROM c',
        })
        .fetchAll()
    ).resources.map((term: CourseListMetaData) => term.id);
  }
}
