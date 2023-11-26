/**
 * Define type and used CRUD methods for courseList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
// const COURSE_LIST_META_DATA = 'courseListMetaData';

export default class CourseListMetaData {
  termCode: string;
  hash: string;
  lastChecked: Date | string;

  constructor(termCode: string, hash: string, lastChecked: Date | string) {
    this.termCode = termCode;
    this.hash = hash;
    this.lastChecked = lastChecked;
  }
}
