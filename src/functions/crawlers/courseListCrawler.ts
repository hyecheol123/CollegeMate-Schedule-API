/**
 *  Course List Crawler Function
 *  Calls the API for wisc course list and returns the data
 *  
 *  @author Jeonghyeon Park <fishbox0923@gmail.com>
 * 
 */

export default async function courseListCrawler(termId: string) {
    const url = 'https://public.enroll.wisc.edu/api/search/v1';
    let found = 0;
    const courseList: any[] = [];

    // Look for the size of the course list
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "selectedTerm": termId,
            "queryString": "*",
            "page": 1,
            "pageSize": 1
        })
    })
    .then(res => res.json())
    .then(json => {
        found =json.found;
    });

    // Fetch the course list
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "selectedTerm": termId,
            "queryString": "*",
            "page": 1,
            "pageSize": found
        })
    })
    .then(res => res.json())
    .then(json => {
        const courseInfo = json.hits.map((course: any) => {
            return {
                id: termId + "-" + course.courseId,
                courseName: course.courseDesignation,
                courseId: course.courseId,
                subjectCode: course.subject.subjectCode,
                description: course.description,
                fullCourseName: course.fullCourseDesignation,
                termCode: termId,
                title: course.title
            };
        });
        courseList.push(courseInfo);
    });

    console.log(courseList);
    return courseList;
}

// courseListCrawler("1244");