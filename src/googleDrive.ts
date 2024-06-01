/** googleDrive
 *
 * Description
 *   - A Class For Handling GoogleDrive
 *
 * Functions
 *   [X] Authentication for GoogleSheet
 *   [X] listFiles
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install googleapis
 *   - ./googleAuth
 *
 * References
 *   - https://developers.google.com/drive/api/quickstart/nodejs?hl=ko
 *   - https://developers.google.com/drive/api/reference/rest?hl=ko
 *
 * Authors
 *   - Moon In Learn <mooninlearn@gmail.com>
 *   - JnJsoft Ko <jnjsoft.ko@gmail.com>
 */

// & Import AREA
// &---------------------------------------------------------------------------
// ? Builtin Modules

// ? External Modules
import { google } from "googleapis";

// ? Local Modules
import { GoogleAuth } from "./googleAuth.js";

// & Class AREA
// &---------------------------------------------------------------------------
export class GoogleDrive {
  service: any;
  googleAuth;

  // * CONSTRUCTOR
  /** GoogleAuth 참조(googleAuth.ts)
   */
  constructor(user: string = "bigwhitekmc", type: string = "oauth2", sn: number = 0) {
    this.googleAuth = new GoogleAuth(user, type, sn);
  }

  /** init
   */
  async init() {
    const auth = await this.googleAuth.authorize();
    this.service = google.drive({ version: "v3", auth });
  }

  /** listFiles
   *  list Files in google drive
   */
  listFiles = async () => {
    const drive = await this.service;
    const res = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });
    const files = res.data.files;
    if (files?.length === 0) {
      console.log("No files found.");
      return;
    }
    return files;
  };
}

// & Test AREA
// &---------------------------------------------------------------------------
// const gd = new GoogleDrive();
// await gd.init();

// // * googleDrive 테스트
// const files = await gd.listFiles();
// console.log("files", files);
