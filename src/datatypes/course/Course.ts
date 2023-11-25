/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
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
   * Create a new course
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {Course} course course to be created
   */
  static async create(
    dbClient: Cosmos.Database,
    course: Course
  ): Promise<void> {
    await dbClient.container(COURSE).items.create(course);
  }

  /**
   * Delete a courses in a term
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} termCode term code of the courses to be deleted
   */
  static async deleteAll(
    dbClient: Cosmos.Database,
    termCode: string
  ): Promise<void> {
    const dbOps = await dbClient
      .container(COURSE)
      .items.query({
        query: `SELECT * FROM ${COURSE} c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: termCode,
          },
        ],
      })
      .fetchAll();

    for (const course of dbOps.resources) {
      await dbClient.container(COURSE).item(course.id).delete();
    }
  }
}
