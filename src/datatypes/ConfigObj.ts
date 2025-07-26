/**
 * Define types for the objects related with configuring the server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

/**
 * Interface to define ConfigObj object
 * This type of object will given to the constructor of ServerConfig
 */
export interface ConfigObj {
  db: DbObj; // contain database configuration parameters
  expressPort: number; // indicate express server port
  webpageOrigin: string; // indicate our website Origin for CORS validation
  // COMMENTED OUT: Authentication-related config fields
  // jwtKeys: JwtKeyObj; // indicate jwt token credentials
  // serverDomainPath: ServerDomainPathObj; // indicate server's domain and path
  // applicationKey: string[]; // Indicate the list of applicationKey (Mobile Application Origin Check)
  // serverAdminKey: string; // Indicate unique key for this server
}

/**
 * Interface to define DbObj object
 * This type of object should be contained in the ConfigObj
 */
export interface DbObj {
  endpoint: string; // URL indicating the location of database server and port
  key: string;
  databaseId: string; // default database name
}

// COMMENTED OUT: Authentication-related interface definitions
// /**
//  * Interface to define jwtKeyObj object
//  * This type of object should be contained in the ConfigObj
//  */
// export interface JwtKeyObj {
//   secretKey: string; // key that used to validate the token
// }

// /**
//  * Interface to define server's domain and path
//  * This type of object should be contained in the ConfigObj.
//  */
// export interface ServerDomainPathObj {
//   domain: string; // API Server's Domain
//   path?: string; // API Server's path
// }
