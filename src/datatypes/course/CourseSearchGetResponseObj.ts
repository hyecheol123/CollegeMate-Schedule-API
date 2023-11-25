/**
 * Define type for received list response object
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

export default interface CourseSearchGetResponseObj {
    found : boolean;
    result : {
        courseId: string;
        courseName: string;
        description: string;
        fullCourseName: string;
        title: string;
        sessionList: {
            id: string;
            sessionId: string;
            meetings: {
                buildingName: string;
                room: string;
                meetingDaysList: string[];
                meetingType: string;
                startTime: {
                    month: number;
                    day: number;
                    hour: number;
                    min : number;
                }[];
                endTime: {
                    month: number;
                    day: number;
                    hour: number;
                    min : number;
                }[];
                instructors: {
                    name: {
                        first: string;
                        last: string;
                    };
                    email: string;
                }[];
            }[];
            credits: number;
            isAsynchronous: boolean;
            onlineOnly: boolean;
        }[];
    }[];
};
  