import { google } from 'googleapis';
import { GoogleAuth } from './googleAuth.js';

export class GoogleDrive {
  driveAPI;
  googleAuth;

  // & CONSTRUCTOR
  constructor(name: string, authType: string='goc', sn: number=0) {
    this.googleAuth = new GoogleAuth(name, authType, sn);
    this.driveAPI = this.googleDrive();
  }

  // & GOOGLESHEETS
  googleDrive = async() => {
    const auth = await this.googleAuth.authorize();
    return google.drive({version: 'v3', auth});
  }

  listFiles = async() => {
    const drive = await this.driveAPI;
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    });
    const files = res.data.files;
    if (files?.length === 0) {
      console.log('No files found.');
      return;
    }
    return files;
  }

}

// & TEST
// const gd = new GoogleDrive('mooninlearn');

// // * googleDrive 테스트
// const files = await gd.listFiles();
// console.log('files', files);