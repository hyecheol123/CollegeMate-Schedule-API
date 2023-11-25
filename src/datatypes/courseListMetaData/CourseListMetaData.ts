/**
 * Define type and used CRUD methods for courseList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';
import BadRequestError from '../../exceptions/BadRequestError';

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
   * Search course within CourseListMetaData and provide course name with termcode
   * 
   * @param dbClient Cosmos.Database
   * @param termCode string
   * @param courseName string
   */

  static async searchCourse(dbClient: Cosmos.Database, termCode: string, courseName: string) {
    try {
      // check if the database has the data corresponding to the termCode and courseName
      const querySpec: Cosmos.SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.termCode = @termCode AND c.courseName = @courseName',
        parameters: [
          {
            name: '@termCode',
            value: termCode,
          },
          {
            name: '@courseName',
            value: courseName,
          },
        ],
      };
      const courseListMetaData: CourseListMetaData[] = (
        await dbClient.container(COURSE_LIST_META_DATA).items.query(querySpec).fetchAll()
      ).resources;

      if (courseListMetaData.length === 0) {
        throw new BadRequestError();
        
      }
      return courseListMetaData;
    }
    catch (e) {
      throw e;
    }
  }
}
