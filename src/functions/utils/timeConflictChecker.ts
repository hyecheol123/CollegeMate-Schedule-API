/**
 * Utility to check if any time conflicts exist within the given array of time ranges
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
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

/**
 * Check if any time conflicts exist within the given array of time ranges
 *
 * @param timeRanges Array of time ranges to check for conflicts
 * @returns true if any conflicts exist, false otherwise
 */
export default function timeConflictChecker(timeRanges: TimeRange[]): boolean {
  for (let i = 0; i < timeRanges.length; i++) {
    for (let j = i + 1; j < timeRanges.length; j++) {
      if (
        timeRanges[i].meetingDaysList.some(day =>
          timeRanges[j].meetingDaysList.includes(day)
        )
      ) {
        // filter out cases where starting months and days are before or after each other
        if (
          (timeRanges[i].endTime.month < timeRanges[j].startTime.month &&
            timeRanges[i].endTime.day < timeRanges[j].startTime.day) ||
          (timeRanges[i].endTime.month === timeRanges[j].startTime.month &&
            timeRanges[i].endTime.day === timeRanges[j].startTime.day &&
            (timeRanges[i].endTime.hour < timeRanges[j].startTime.hour ||
              (timeRanges[i].endTime.hour === timeRanges[j].startTime.hour &&
                timeRanges[i].endTime.minute <=
                  timeRanges[j].startTime.minute))) ||
          (timeRanges[j].endTime.month < timeRanges[i].startTime.month &&
            timeRanges[j].endTime.day < timeRanges[i].startTime.day) ||
          (timeRanges[j].endTime.month === timeRanges[i].startTime.month &&
            timeRanges[j].endTime.day === timeRanges[i].startTime.day &&
            (timeRanges[j].endTime.hour < timeRanges[i].startTime.hour ||
              (timeRanges[j].endTime.hour === timeRanges[i].startTime.hour &&
                timeRanges[j].endTime.minute <=
                  timeRanges[i].startTime.minute)))
        ) {
          continue;
        }
        // check if the time ranges overlap for the hours and minutes
        if (
          timeRanges[i].endTime.hour < timeRanges[j].startTime.hour ||
          (timeRanges[i].endTime.hour === timeRanges[j].startTime.hour &&
            timeRanges[i].endTime.minute <= timeRanges[j].startTime.minute) ||
          timeRanges[j].endTime.hour < timeRanges[i].startTime.hour ||
          (timeRanges[j].endTime.hour === timeRanges[i].startTime.hour &&
            timeRanges[j].endTime.minute <= timeRanges[i].startTime.minute)
        ) {
          continue;
        }
        return true;
      }
    }
  }
  return false;
}
