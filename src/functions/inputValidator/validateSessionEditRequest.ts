/**
 * Validate request body for POST /schedule/:scheduleId/event/:eventId
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateSessionEditRequest = new Ajv().compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        eventType: {type: 'string', enum: ['session']},
        sessionId: {type: 'string'},
        memo: {type: 'string'},
        colorCode: {type: 'number'},
      },
      required: ['eventType'],
      anyOf: [{required: ['sessionId']}, {required: ['colorCode']}],
      additionalProperties: false,
    },
    {
      properties: {
        eventType: {type: 'string', enum: ['event']},
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
      anyOf: [
        {required: ['title']},
        {required: ['location']},
        {required: ['meetingDaysList']},
        {required: ['startTime']},
        {required: ['endTime']},
        {required: ['memo']},
        {required: ['colorCode']},
      ],
      additionalProperties: false,
    },
  ],
});
