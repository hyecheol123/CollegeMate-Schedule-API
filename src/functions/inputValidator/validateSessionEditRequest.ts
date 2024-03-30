/**
 * Validate request body for POST /schedule/:scheduleId/event/:eventId
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateSessionEditRequest = new Ajv().compile({
  type: 'object',
  properties: {
    eventType: {type: 'string'},
    sessionId: {type: 'string'},
    title: {type: 'string'},
    location: {type: 'string'},
    meetingDaysList: {type: 'array', items: {type: 'string'}},
    startTime: {
      type: 'object',
      properties: {
        month: {type: 'number'},
        day: {type: 'number'},
        hour: {type: 'number'},
        minute: {type: 'number'},
      },
      required: ['month', 'day', 'hour', 'minute'],
      additionalProperties: false,
    },
    endTime: {
      type: 'object',
      properties: {
        month: {type: 'number'},
        day: {type: 'number'},
        hour: {type: 'number'},
        minute: {type: 'number'},
      },
      required: ['month', 'day', 'hour', 'minute'],
      additionalProperties: false,
    },
    memo: {type: 'string'},
    colorCode: {type: 'number'},
  },
  required: ['eventType'],
  additionalProperties: false,
});
