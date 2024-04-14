/**
 * Validate request body for PATCH /schedule/:scheduleId/event/:eventId
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
        meetingDaysList: {
          type: 'array',
          items: {
            enum: [
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY',
              'SUNDAY',
            ],
          },
        },
        startTime: {
          type: 'object',
          properties: {
            month: {type: 'number', minimum: 1, maximum: 12},
            day: {type: 'number', minimum: 1, maximum: 31},
            hour: {type: 'number', minimum: 0, maximum: 23},
            minute: {type: 'number', minimum: 0, maximum: 59},
          },
          required: ['month', 'day', 'hour', 'minute'],
          additionalProperties: false,
        },
        endTime: {
          type: 'object',
          properties: {
            month: {type: 'number', minimum: 1, maximum: 12},
            day: {type: 'number', minimum: 1, maximum: 31},
            hour: {type: 'number', minimum: 0, maximum: 23},
            minute: {type: 'number', minimum: 0, maximum: 59},
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
