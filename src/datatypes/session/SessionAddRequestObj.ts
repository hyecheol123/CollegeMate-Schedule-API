/**
 * Define type for SessionAddRequestObj
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

/**
 * Interface for SessionAddRequestObj
 */
export default interface SessionAddRequestObj {
  eventType: string;
  sessionId?: string;
  title?: string;
  location?: string;
  meetingDaysList?: string[];
  startTime?: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  endTime?: {
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  memo?: string;
  colorCode: number;
}
