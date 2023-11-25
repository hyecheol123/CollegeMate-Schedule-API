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
  termCode: string;
  hash: string;
  lastChecked: Date | string;

  constructor(termCode: string, hash: string, lastChecked: Date | string) {
    this.termCode = termCode;
    this.hash = hash;
    this.lastChecked = lastChecked;
  }

  /**
   * Get a list of all available terms
   * 
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   */
  static async getTermList(dbClient: Cosmos.Database) {
    return (
      await dbClient.container(COURSE_LIST_META_DATA).items.query({
        query: 'SELECT c.termCode FROM c'
      }).fetchAll()
    ).resources.map((term: { termCode: string }) => term.termCode);
  }
}
