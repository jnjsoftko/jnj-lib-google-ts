/** UdemyWeb
 *
 * Description
 *   - A Class For Scrapping Udemy Web
 *
 * Functions
 *   [X] login udemy.com
 *
 *   [X] courseList
 *   [X] courseDetail
 *   [X] curriculum
 *   [X] transript
 *   [X] handout
 *
 *   [X] purchaseHistory
 *
 * Usages
 *   -
 *
 * Requirements
 *   - Create `udemy` web account(Register at `udemy.com`)
 *
 * References
 *   -
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

// ? UserMade Modules

// ? Local Modules
import { GoogleAuth } from "./googleAuth.js";

// & Function AREA
// &---------------------------------------------------------------------------
// ^ Utils
// ^---------------------------------------------------------------------------
// * Column Notation
/** indexToLetter
 * @example
 *  indexToLetter(2)
 *  => "B"
 */
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

/** letterToIndex
 * @example
 *  letterToIndex("D")
 *  => 4
 */
const letterToIndex = (letter = "A") => {
  let index = 0,
    length = letter.length;
  for (let i = 0; i < length; i++) {
    index += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return index;
};

// * Cell Notation
/** arrToCell
 * @example
 *  cellA1Noation([2, 4])
 *  => "D2"
 */
const arrToCell = (arr = [2, 4]) => {
  const cells = [`${arr[0]}`];
  const totalAlphabets = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
  let block = arr[1] - 1;
  while (block >= 0) {
    cells.unshift(String.fromCharCode((block % totalAlphabets) + "A".charCodeAt(0)));
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return cells.join("");
};

/** arrToCell
 * @example
 *  cellToArr("A2")
 *  => [1, 3]
 */
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

/** rangeByStart
 * @example
 *  rangeByStart(start = [3, 2], size = [1, 2])
 *  => "B3:C5"
 */
const rangeByStart = (start = [3, 2], size = [1, 2]) => {
  return `${arrToCell(start)}:${arrToCell([start[0] + size[0], start[1] + size[1]])}`;
};

// & Class AREA
// &---------------------------------------------------------------------------
export class GoogleSheet {
  sheetAPI;
  googleAuth;

  // * CONSTRUCTOR
  /** constructor
   * @param name: user Nick (ex: `mooninlearn`)
   * @param authType: goc(Google OAuth 2.0 Client ID) | gsa(Google Service Account) | gst(Google Saved Token) | gak(Google API Key)
   * @param sn: serial number
   */
  constructor(name: string, authType: string = "goc", sn: number = 0) {
    this.googleAuth = new GoogleAuth(name, authType, sn);
    this.sheetAPI = this.googleSheet();
  }

  // * GOOGLESHEETS
  /** googleSheet
   *  authorized google sheets
   */
  googleSheet = async () => {
    const auth = await this.googleAuth.authorize();
    return google.sheets({ version: "v4", auth });
  };

  // * CRUD
  /** getSheetNames
   *   googleSheets 내에 있는 sheetName
   * @param all: true(전체 시트) | false(`_`로 시작하는 sheet 제외)
   */
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

  /** getValues
   *   googleSheets(`spreadsheetId`) 내에 있는 `sheetName`의 시트에서 `range`에 해당하는 Data(rows) 반환
   */
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

  /** setValues
   *   googleSheets(`spreadsheetId`) 내에 있는 `sheetName`의 시트에 `start` 셀부터 data(`values`, arrays of array)를 덮어씀(update)
   */
  setValues = async ({ values = [[]], start = "A1", sheetName = "", spreadsheetId = "" }) => {
    const range = rangeByStart(cellToArr(start), [values.length, values[0].length]);
    const sheetAPI = await this.sheetAPI;
    await sheetAPI.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range ? `${sheetName}!${range}` : sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: values, // [["hello", "world"]]
      },
    });
  };

  /** appendValues
   *   googleSheets(`spreadsheetId`) 내에 있는 `sheetName`의 시트에 기존 내용 뒤에 data(`values`, arrays of array)를 추가(update)
   */
  appendValues = async ({ values = [[]], start = "A1", sheetName = "", spreadsheetId = "" }) => {
    const range = rangeByStart(cellToArr(start), [values.length, values[0].length]);
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

// & Test AREA
// &---------------------------------------------------------------------------
// // & TEST
// const googleSheet = new GoogleSheet("mooninlearn");

// // * Get Values
// const range = "A2:B5";
// const sheetName = "Sheet1";
// const spreadsheetId = "14HsVYROe_RDI2zg6C1S8uAYUen4a7wIh0_p7VTtxn-A";
// const values = await googleSheet.getValues({ range, sheetName, spreadsheetId });
// console.log("values", values);

// // * Set Values
// const start = 'F5';
// const values = [["hello", "world"]];
// const sheetName = 'Sheet2';
// const spreadsheetId = '14HsVYROe_RDI2zg6C1S8uAYUen4a7wIh0_p7VTtxn-A';
// await googleSheet.setValues({values, start, sheetName, spreadsheetId});
