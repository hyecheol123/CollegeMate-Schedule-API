/**
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

export default interface SessionCreateRequestObj {
  eventType: string;
  sessionId: string;
  title: string;
  location: string;
  meetingDaysList: string[];
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
  memo: string;
  colorCode: number;
}
