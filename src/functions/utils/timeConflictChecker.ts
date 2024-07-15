/**
 * Utility to check if any time conflicts exist within the given array of time ranges
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

export interface TimeRange {
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
}

function isBefore(
  time1: {month: number; day: number; hour: number; minute: number},
  time2: {month: number; day: number; hour: number; minute: number}
): boolean {
  if (time1.month < time2.month) return true;
  if (time1.month > time2.month) return false;
  if (time1.day < time2.day) return true;
  if (time1.day > time2.day) return false;
  if (time1.hour < time2.hour) return true;
  if (time1.hour > time2.hour) return false;
  return time1.minute <= time2.minute;
}

function isOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return !(
    isBefore(range1.endTime, range2.startTime) ||
    isBefore(range2.endTime, range1.startTime)
  );
}

export default function timeConflictChecker(timeRanges: TimeRange[]): boolean {
  for (let i = 0; i < timeRanges.length; i++) {
    for (let j = i + 1; j < timeRanges.length; j++) {
      if (
        timeRanges[i].meetingDaysList.some(day =>
          timeRanges[j].meetingDaysList.includes(day)
        ) &&
        isOverlap(timeRanges[i], timeRanges[j])
      ) {
        return true;
      }
    }
  }
  return false;
}
