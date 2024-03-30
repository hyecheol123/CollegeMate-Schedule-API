/**
 * Validate request body for POST /schedule/course-list/:termCode/update
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateCourseListUpdateRequest = new Ajv().compile({
  type: 'object',
  properties: {
    forceUpdate: {type: 'boolean'},
  },
  required: ['forceUpdate'],
  additionalProperties: false,
});
