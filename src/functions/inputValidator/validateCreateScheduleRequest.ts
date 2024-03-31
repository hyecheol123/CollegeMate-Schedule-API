/**
 * Validate input for Create Schedule Request
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateCreateScheduleRequest = new Ajv().compile({
  type: 'object',
  properties: {
    termCode: {type: 'string'},
  },
  required: ['termCode'],
  additionalProperties: false,
});
