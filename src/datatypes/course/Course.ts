/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import CourseSearchGetResponseObj from './CourseSearchGetResponseObj';
import BadRequestError from '../../exceptions/BadRequestError';
import Session from '../session/Session';
// import ServerConfig from '../../ServerConfig';

// DB Container id
const COURSE = 'course';

export default class Course {
  id: string;
  courseName: string;
  courseId: string;
  subjectCode: string;
  description: string;
  fullCourseName: string;
  termCode: string;
  title: string;

  constructor(
    id: string,
    courseName: string,
    courseId: string,
    subjectCode: string,
    description: string,
    fullCourseName: string,
    termCode: string,
    title: string
  ) {
    this.id = id;
    this.courseName = courseName;
    this.courseId = courseId;
    this.subjectCode = subjectCode;
    this.description = description;
    this.fullCourseName = fullCourseName;
    this.termCode = termCode;
    this.title = title;
  }

  /**
   * Search course within CourseListMetaData and provide course name with termcode
   * 
   * @param dbClient Cosmos.Database
   * @param termCode string
   * @param courseName string
   */

  static async getCourse(dbClient: Cosmos.Database, termCode: string, courseName: string) {
    try {
      // Get courseList from DB with the corresponding termCode and courseName
      const courseList: Course[] = (
        await dbClient.container(COURSE).items.query({
          query: 'SELECT * FROM c WHERE c.termCode = @termCode AND (c.courseName = @courseName OR c.fullCourseName = @courseName)',
          parameters: [
            {
              name: '@termCode',
              value: termCode,
            },
            {
              name: '@courseName',
              value: courseName,
            }
          ],
        }).fetchAll()
      ).resources;

      if (courseList.length === 0) {
        throw new BadRequestError();
      }

      return courseList;
    }
    catch (e) {
      throw e;
    }
  }
}
