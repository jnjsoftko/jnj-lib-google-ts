import Path from "path";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { loadJson, saveJson } from "jnj-lib-base";
import dotenv from "dotenv";
dotenv.config(); // 실행 경로에 있는 `.env`

const settingsPath =
  process.env.ENV_SETTINGS_PATH ?? "C:/JnJ-soft/Developments/_Settings";

const SCOPES = [
  "https://www.googleapis.com/auth/drive", //googledrive
  "https://www.googleapis.com/auth/spreadsheets", // googlesheet
  "https://www.googleapis.com/auth/script.projects", // appsscript
  // "https://www.googleapis.com/auth/script.scriptapp",
];

export class GoogleAuth {
  tokenPath: string = "";
  crendentialsPath: string = "";
  scopes: string[];
  // client; // OAuth2Client

  // & CONSTRUCTOR
  // gak(Google API Key) | goc(Google OAuth 2.0 Client ID) | gsa(Google Service Account) | gst(Google Saved Token)
  // <authType>_<name>_<sn>.json   ex: gsa_mooninlearn
  constructor(name: string, authType: string = "goc", sn: number = 0) {
    this.scopes = SCOPES;
    switch (authType) {
      case "goc":
        this.tokenPath = Path.join(
          settingsPath!,
          `Apis/google/token_${name}_${sn}.json`
        );
        this.crendentialsPath = Path.join(
          settingsPath!,
          `Apis/google/${authType}_${name}_${sn}.json`
        );
    }
    // this.client = this.authorize();
  }

  // & AUTHORIZATION
  /**
   * Reads previously authorized credentials from the save file.
   *
   * @return {Promise<OAuth2Client|null>}
   */
  async loadSavedCredentialsIfExist() {
    try {
      // return await google.auth.fromJSON(loadJson(this.tokenPath)); // ! `JSON.parse`를 2번 사용해야 하는 이유 확인 필요
      return await google.auth.fromJSON(JSON.parse(loadJson(this.tokenPath))); // ! `JSON.parse`를 2번 사용해야 하는 이유 확인 필요
    } catch (err) {
      // console.log(err);
      return null;
    }
  }

  /**
   * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
   *
   * @param {OAuth2Client} client
   * @return {Promise<void>}
   */
  async saveCredentials(client: any) {
    const keys = loadJson(this.crendentialsPath);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    saveJson(this.tokenPath, payload);
  }

  /**
   * Load or request or authorization to call APIs.
   *
   */
  async authorize() {
    let client: any = await this.loadSavedCredentialsIfExist();
    // console.log('@@@@client', client);
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: this.scopes,
      keyfilePath: this.crendentialsPath,
    });
    if (client.credentials) {
      await this.saveCredentials(client);
    }
    return client;
  }
}

// // & TEST
// const googleAPI = new GoogleAuth("mooninlearn", "goc");

// // * 인증 TEST
// const authed = await googleAPI.authorize();
// console.log(authed);
