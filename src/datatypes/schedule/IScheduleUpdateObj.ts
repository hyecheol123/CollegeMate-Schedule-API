/**
 * Define type for IScheduleUpdateObj
 * - eventList: eventList of the schedule
 * - sessionList: sessionList of the schedule
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import {Event} from './Schedule';

/**
 * Interface for IScheduleUpdateObj
 */
export default interface IScheduleUpdateObj {
  eventList?: Event[];
  sessionList?: {
    id: string;
    colorCode: number;
  }[];
}
