/**
 * Define type and used CRUD methods for each courses
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../../ServerConfig';

// DB Container id
const SESSION = 'session';

interface Meeting {
  buildingName: string;
  room: string;
  meetingDaysList: string[];
  meetingType: string;
  startTime: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  endTime: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  instructors: {
    campusId: string;
    email: string;
    name: {
      first: string;
      middle: string;
      last: string;
    };
  }[];
};

export default class Session {
  id: string;
  courseId: string;
  termCode: string;
  sessionId: string;
  meetings: Meeting[];
  credit: number;
  isAsyncronous: boolean;
  onlineOnly: boolean;
  topic: string;

  constructor(
    id: string,
    courseId: string,
    termCode: string,
    sessionId: string,
    meetings: Meeting[],
    credit: number,
    isAsyncronous: boolean,
    onlineOnly: boolean,
    topic: string
  ) {
    this.id = id;
    this.courseId = courseId;
    this.termCode = termCode;
    this.sessionId = sessionId;
    this.meetings = meetings;
    this.credit = credit;
    this.isAsyncronous = isAsyncronous;
    this.onlineOnly = onlineOnly;
    this.topic = topic;
  }
}
