/**
 * Define type for SessionEditRequestObj
 * - eventType(required): string
 * - sessionId: string
 * - title: string
 * - location: string
 * - meetiongDaysList: Enum[] (e.g. [MONDAY, WEDNESDAY, FRIDAY])
 * - startTime: Object
 *     {month(required): int,
 *     day(required): int,
 *     hour(required): int,
 *     minute(required): int}
 * - endTime: Object
 *     {month(required): int,
 *     day(required): int,
 *     hour(required): int,
 *     minute(required): int}
 * - memo: string
 * - colorCode: int
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

/**
 * Interface for SessionEditRequestObj
 */
export default interface SessionEditRequestObj {
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
