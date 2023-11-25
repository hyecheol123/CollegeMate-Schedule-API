/**
 * File to execute when jest test environmet is started.
 * Mocking courseListCrawler function to return mock data.
 * Mocking sessionListCrawler function to return mock data.
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import session001065 from './testData/session1244-168-001065.json';

// Major List Mock Data
jest.mock('../src/functions/crawlers/courseListCrawler', () => ({
  __esModule: true,
  default: jest.fn(async () => {
    return session001065;
  }),
}));

// Course List Mock Data
jest.mock('../src/functions/crawlers/courseListCrawler', () => ({
  __esModule: true,
  default: jest.fn(async () => {
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
  }),
}));
