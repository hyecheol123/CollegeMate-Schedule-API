/**
 * Validate request body for POST /schedule/course-list/:termCode/update
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import Ajv from 'ajv';

export const validateCourseSearchRequest = new Ajv().compile({
  type: 'object',
  properties: {
    termCode: {type: 'string'},
    courseName: {type: 'string'},
  },
  required: ['termCode', 'courseName'],
  additionalProperties: false,
});
