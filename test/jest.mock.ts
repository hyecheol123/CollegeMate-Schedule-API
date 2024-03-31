/**
 * File to execute when jest test environmet is started.
 * Mocking courseListCrawler function to return mock data.
 * Mocking sessionListCrawler function to return mock data.
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as session1244001065 from './testData/session1244-168-001065.json';
import * as session1234001065 from './testData/session1234-168-001065.json';
import * as session1242000441 from './testData/session1242-112-000441-edit.json';
import * as session1242004289 from './testData/session1242-266-004289-edit.json';

// Course List Mock Data
jest.mock('../src/functions/crawlers/courseListCrawler', () => ({
  __esModule: true,
  default: jest.fn(async (termCode: string) => {
    switch (termCode) {
      case '1244':
        return [
          {
            id: '1244-001065',
            courseName: 'ART 102',
            courseId: '001065',
            subjectCode: '168',
            description:
              'Provides an introduction to the fundamentals of two-dimensional design. Develop a clear understanding of visual communication through problem-solving and formal and conceptual experimentation. Learn the elements and principles of design and manipulate those using analog and digital processes. Introduction to the Adobe Creative Suite of products, including InDesign, Illustrator, and (to a lesser degree) Photoshop. Serves as an introduction to professional presentation skills and techniques to hone craftsmanship. ',
            fullCourseName: 'ART DEPARTMENT 102',
            termCode: '1244',
            title: 'Two-Dimensional Design',
          },
        ];

      case '1242':
        return [
          {
            id: '1242-000441',
            courseName: 'BSE 1',
            courseId: '000441',
            subjectCode: '112',
            description:
              'Full-time off-campus work experience which combines classroom theory with practical knowledge of operations to provide a background upon which to base a professional career. ',
            fullCourseName: 'BIOLOGICAL SYSTEMS ENGINEERING 1',
            termCode: '1242',
            title: 'Cooperative Education Program',
          },
          {
            id: '1242-004289',
            courseName: 'COMP SCI 577',
            courseId: '004289',
            subjectCode: '266',
            description:
              'Basic paradigms for the design and analysis of efficient algorithms: greed, divide-and-conquer, dynamic programming, reductions, and the use of randomness. Computational intractability including typical NP-complete problems and ways to deal with them. ',
            fullCourseName: 'COMPUTER SCIENCES 577',
            termCode: '1242',
            title: 'Introduction to Algorithms',
          },
        ];

      default:
        return [
          {
            id: '1234-001065',
            courseName: 'ART 102',
            courseId: '001065',
            subjectCode: '168',
            description:
              'Provides an introduction to the fundamentals of two-dimensional design. Develop a clear understanding of visual communication through problem-solving and formal and conceptual experimentation. Learn the elements and principles of design and manipulate those using analog and digital processes. Introduction to the Adobe Creative Suite of products, including InDesign, Illustrator, and (to a lesser degree) Photoshop. Serves as an introduction to professional presentation skills and techniques to hone craftsmanship. ',
            fullCourseName: 'ART DEPARTMENT 102',
            termCode: '1234',
            title: 'Two-Dimensional Design',
          },
        ];
    }
  }),
}));

// Session List Mock Data
jest.mock('../src/functions/crawlers/sessionListCrawler', () => ({
  __esModule: true,
  default: jest.fn(
    async (termCode: string, subjectCode: string, courseId: string) => {
      switch (termCode) {
        case '1244':
          return session1244001065;

        case '1242':
          switch (courseId) {
            case '000441':
              return session1242000441;
            case '004289':
              return session1242004289;
            default:
              return session1242004289;
          }

        default:
          return session1234001065;
      }
    }
  ),
}));

// Get Friend List Mock Data
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
