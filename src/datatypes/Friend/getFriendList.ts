/**
 * Function to retrieve Friend List from Friend API
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import {Request} from 'express';

/**
 * Function to retrieve Friend List from Friend API
 *
 * @param {string} email - email of the user
 * @param {Request} req - express request object
 * @return {Promise<Friend[]>} - list of friends
 */

export default async function getFriendList(
  email: string,
  req: Request
): Promise<string[]> {
  let response = await fetch('https://api.collegemate.app/friend', {
    method: 'GET',
    headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
    body: JSON.stringify({email: email}),
  });

  if (response.status === 401 || response.status === 403) {
    // Retry with new serverAdminToken
    response = await fetch('https://api.collegemate.app/auth/login', {
      method: 'GET',
      headers: {'X-SERVER-KEY': req.app.get('serverAdminKey')},
    });
    if (response.status !== 200) {
      throw new Error('[Fail on serverAdminToken renewal]');
    }
    const serverAdminTokenReq = (await response.json()).serverAdminToken;
    req.app.set('serverAdminToken', serverAdminTokenReq);
    response = await fetch('https://api.collegemate.app/friend', {
      method: 'GET',
      headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
      body: JSON.stringify({email: email}),
    });
  }

  if (response.status !== 200) {
    throw new Error('[Fail on retreiving friend list]');
  }

  // Found requested friend list
  const friendList = await response.json();

  return friendList;
}
