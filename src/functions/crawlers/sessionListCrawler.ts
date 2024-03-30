/**
 * Crawler for session list
 * Calls the API for wisc course and returns the list of sessions
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Session, {Meeting} from '../../datatypes/session/Session';

/**
 * Calls API call for termCode, subjectCode, and courseId for the course and returns the list of sessions
 *
 * @returns {Session[]} List of sessions
 */
export default async function sessionListCrawler(
  termCode: string,
  subjectCode: string,
  courseId: string
): Promise<Session[]> {
  const sessionList: Session[] = [];
  let topic: string | undefined = undefined;
  const url = `https://public.enroll.wisc.edu/api/search/v1/enrollmentPackages/${termCode}/${subjectCode}/${courseId}`;

  await fetch(url, {
    method: 'GET',
  })
    .then(res => res.json())
    .then(data => {
      Array.from(data).forEach((session: any) => {
        const meetingList: Meeting[] = [];
        Array.from(session.sections).forEach((section: any) => {
          if (section.topic) topic = section.topic;
          Array.from(section.classMeetings).forEach((meeting: any) => {
            const startDateTime = new Date(
              new Date(
                section.startDate + meeting.meetingTimeStart - 21600000
              ).toLocaleString('en-US', {timeZone: 'America/Chicago'})
            );
            const endDate = new Date(
              new Date(
                section.endDate + meeting.meetingTimeEnd - 21600000
              ).toLocaleString('en-US', {timeZone: 'America/Chicago'})
            );
            const endTime = new Date(
              new Date(
                section.startDate + meeting.meetingTimeEnd - 21600000
              ).toLocaleString('en-US', {timeZone: 'America/Chicago'})
            );

            const startTimeObj = {
              month: startDateTime.getMonth() + 1,
              day: startDateTime.getDate(),
              hour: startDateTime.getHours(),
              minute: startDateTime.getMinutes(),
            };
            const endTimeObj = {
              month: endDate.getMonth() + 1,
              day: endDate.getDate(),
              hour: endTime.getHours(),
              minute: endTime.getMinutes(),
            };
            const instructors: {
              campusId: string | undefined;
              email: string;
              name: {
                first: string;
                middle: string | undefined;
                last: string;
              };
            }[] = [];
            Array.from(section.instructors).forEach((instructor: any) => {
              instructors.push({
                campusId: !instructor.campusid
                  ? undefined
                  : instructor.campusId,
                email: instructor.email,
                name: {
                  first: instructor.name.first,
                  middle: !instructor.name.middle
                    ? undefined
                    : instructor.name.middle,
                  last: instructor.name.last,
                },
              });
            });
            meetingList.push({
              buildingName: !meeting.building
                ? undefined
                : meeting.building.buildingName,
              room: !meeting.room ? undefined : meeting.room,
              meetingDaysList: meeting.meetingDaysList,
              meetingType: meeting.meetingType,
              startTime: startTimeObj,
              endTime: endTimeObj,
              instructors: instructors,
            });
          });
        });
        sessionList.push(
          new Session(
            session.termCode + '-' + session.courseId + '-' + session.id,
            session.courseId,
            session.termCode,
            session.id,
            meetingList,
            parseInt(session.creditRange),
            session.isAsynchronous,
            session.onlineOnly,
            topic
          )
        );
      });
    });

  return sessionList;
}
