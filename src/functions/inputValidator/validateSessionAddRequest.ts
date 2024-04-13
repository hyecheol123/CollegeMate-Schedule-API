/**
 * Validate request body for POST /schedule/:scheduleId/event/
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateSessionAddRequest = new Ajv().compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        eventType: {type: 'string', enum: ['session']},
        sessionId: {type: 'string'},
        memo: {type: 'string'},
        colorCode: {type: 'number'},
      },
      required: ['eventType', 'sessionId'],
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
            day: {
              type: 'number',
              if: {
                properties: {month: {enum: [2]}},
              },
              then: {
                if: {
                  properties: {year: {type: 'number', multipleOf: 4}},
                },
                then: {maximum: 29},
                else: {
                  if: {
                    properties: {year: {type: 'number', multipleOf: 400}},
                  },
                  then: {maximum: 28},
                  else: {maximum: 29},
                },
              },
              else: {
                if: {
                  properties: {month: {enum: [1, 3, 5, 7, 8, 10, 12]}},
                },
                then: {maximum: 31},
                else: {maximum: 30},
              },
            },
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
            day: {
              type: 'number',
              if: {
                properties: {month: {enum: [2]}},
              },
              then: {
                if: {
                  properties: {year: {type: 'number', multipleOf: 4}},
                },
                then: {maximum: 29},
                else: {
                  if: {
                    properties: {year: {type: 'number', multipleOf: 400}},
                  },
                  then: {maximum: 28},
                  else: {maximum: 29},
                },
              },
              else: {
                if: {
                  properties: {month: {enum: [1, 3, 5, 7, 8, 10, 12]}},
                },
                then: {maximum: 31},
                else: {maximum: 30},
              },
            },
            hour: {type: 'number', minimum: 0, maximum: 23},
            minute: {type: 'number', minimum: 0, maximum: 59},
          },
          required: ['month', 'day', 'hour', 'minute'],
          additionalProperties: false,
        },
        memo: {type: 'string'},
        colorCode: {type: 'number'},
      },
      required: [
        'eventType',
        'title',
        'meetingDaysList',
        'startTime',
        'endTime',
        'colorCode',
      ],
      additionalProperties: false,
    },
  ],
});
