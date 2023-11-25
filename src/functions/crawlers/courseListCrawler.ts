/**
 *  Course List Crawler Function
 *  Calls the API for wisc course list and returns the data
 *
 *  @author Jeonghyeon Park <fishbox0923@gmail.com>
 *
 */

import Course from '../../datatypes/course/Course';

export default async function courseListCrawler(
  termCode: string
): Promise<Course[]> {
  const url = 'https://public.enroll.wisc.edu/api/search/v1';
  let courseCount = 0;
  let courseList: Course[] = [];

  // Look for the size of the course list
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedTerm: termCode,
      queryString: '*',
      page: 1,
      pageSize: 1,
    }),
  })
    .then(res => res.json())
    .then(json => {
      courseCount = json.found;
    });

  // Fetch the course list
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedTerm: termCode,
      queryString: '*',
      page: 1,
      pageSize: courseCount,
    }),
  })
    .then(res => res.json())
    .then(json => {
      courseList = json.hits.map((course: any) => {
        return {
          id: termCode + '-' + course.courseId,
          courseName: course.courseDesignation,
          courseId: course.courseId,
          subjectCode: course.subject.subjectCode,
          description: course.description,
          fullCourseName: course.fullCourseDesignation,
          termCode: termCode,
          title: course.title,
        };
      });
    });

  return courseList;
}
