/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// Get User Mock Data
jest.mock('../src/datatypes/Friend/getFriendList', () => ({
  __esModule: true,
  default: jest.fn(async (email: string, req: Request) => {
    switch (email) {
      case 'drag@wisc.edu':
        return ['steve@wisc.edu', 'jerry@wisc.edu', 'dickdick@wisc.edu'];
      case 'steve@wisc.edu':
        return ['jeonghyeon@wisc.edu', 'drag@wisc.edu', 'jerry@wisc.edu'];
      default:
        return [];
    }
  }),
}));
