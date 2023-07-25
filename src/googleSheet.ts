import { google } from "googleapis";
import { GoogleAuth } from "./googleAuth.js";

// & Utils
// ** Column Notation
// indexToLetter(2) -> "B"
const indexToLetter = (index = 1) => {
  let temp,
    letter = "";
  while (index > 0) {
    temp = (index - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = (index - temp - 1) / 26;
  }
  return letter;
};

// letterToIndex("D") => 4
const letterToIndex = (letter = "A") => {
  let index = 0,
    length = letter.length;
  for (let i = 0; i < length; i++) {
    index += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return index;
};

// ** cell
// cellA1Noation([2, 4]) -> "D2"
const arrToCell = (arr = [2, 4]) => {
  const cells = [`${arr[0]}`];
  const totalAlphabets = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
  let block = arr[1] - 1;
  while (block >= 0) {
    cells.unshift(
      String.fromCharCode((block % totalAlphabets) + "A".charCodeAt(0))
    );
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return cells.join("");
};

// cellArrNotation("A2") => [1, 3]
function cellToArr(cell = "A1") {
  if (Array.isArray(cell)) return cell;

  const [, columnName, row] = cell.toUpperCase().match(/([A-Z]+)([0-9]+)/);
  const characters = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

  let columnNum = 0;
  columnName.split("").forEach((char: string) => {
    columnNum *= characters;
    columnNum += char.charCodeAt(0) - "A".charCodeAt(0) + 1;
  });

  return [parseInt(row), columnNum];
}

const rangeByStart = (start = [3, 2], size = [1, 2]) => {
  return `${arrToCell(start)}:${arrToCell([
    start[0] + size[0],
    start[1] + size[1],
  ])}`;
};

// & GoogleSheet class
export class GoogleSheet {
  sheetAPI;
  googleAuth;

  // * CONSTRUCTOR
  constructor(name: string, authType: string = "goc", sn: number = 0) {
    this.googleAuth = new GoogleAuth(name, authType, sn);
    this.sheetAPI = this.googleSheet();
    // this.sheetAPI = (async()=>this.googleSheet())();
  }

  // * GOOGLESHEETS
  googleSheet = async () => {
    const auth = await this.googleAuth.authorize();
    return google.sheets({ version: "v4", auth });
  };

  // * Get Sheets
  // getSheetNames = async (spreadsheetId: string, all = false) => {
  getSheetNames = async ({ spreadsheetId = "", all = false }) => {
    // let { spreadsheetId, all } = options;
    // all = all ?? false;
    const sheetAPI = await this.sheetAPI;
    const res = await sheetAPI.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    let names = res.data?.sheets?.map((sheet) => sheet?.properties?.title);
    return all ? names : names?.filter((name) => !name?.startsWith("_")); // all: false => `_`로 시작하는 sheet 제외
  };

  getValues = async ({ range = "", sheetName = "", spreadsheetId = "" }) => {
    const sheetAPI = await this.sheetAPI;
    const res = await sheetAPI.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range ? `${sheetName}!${range}` : sheetName, // range = '' => 'Sheet1'
    });
    const rows = await res.data.values;
    if (!rows || rows.length === 0) {
      return;
    }

    return rows;
  };

  setValues = async ({
    values = [[]],
    start = "A1",
    sheetName = "",
    spreadsheetId = "",
  }) => {
    const range = rangeByStart(cellToArr(start), [
      values.length,
      values[0].length,
    ]);
    const sheetAPI = await this.sheetAPI;
    await sheetAPI.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range ? `${sheetName}!${range}` : sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: values, // [["hello", "world"]]
      },
    });
  };
}

// // & TEST
// const gs = new GoogleSheet("mooninlearn");

// // * Get Values
// const range = "A2:B5";
// const sheetName = "Sheet1";
// const spreadsheetId = "14HsVYROe_RDI2zg6C1S8uAYUen4a7wIh0_p7VTtxn-A";
// const values = await gs.getValues({ range, sheetName, spreadsheetId });
// console.log("values", values);

// // * Set Values
// const start = 'F5';
// const values = [["hello", "world"]];
// const sheetName = 'Sheet2';
// const spreadsheetId = '14HsVYROe_RDI2zg6C1S8uAYUen4a7wIh0_p7VTtxn-A';
// await gs.setValues({values, start, sheetName, spreadsheetId});
