/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';

// DB Container id
// const COURSE = 'course';

export default class Course {
  id: string;
  courseName: string;
  courseId: string;
  description: string;
  fullCourseName: string;
  termCode: string;
  title: string;

  constructor(
    id: string,
    courseName: string,
    courseId: string,
    description: string,
    fullCourseName: string,
    termCode: string,
    title: string
  ) {
    this.id = id;
    this.courseName = courseName;
    this.courseId = courseId;
    this.description = description;
    this.fullCourseName = fullCourseName;
    this.termCode = termCode;
    this.title = title;
  }
}
