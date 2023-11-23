/**
 * Define type and used CRUD methods for sessionList's MetaData
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
// const SESSION_LIST_META_DATA = 'sessionListMetaData';

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
}
