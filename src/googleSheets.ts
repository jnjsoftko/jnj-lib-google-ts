/** googleSheets
 *
 * Description
 *   - A Class For Handling GoogleSheets
 *
 * Functions
 *   [X] Authentication for GoogleSheets
 *
 *   [X] getSheetNames
 *   [X] getValues
 *   [X] setValues
 *   [X] appendValues
 *   [ ] prependValues
 *   [ ] upsertValues(변경된 사항 반영 + 추가)
 *
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install googleapis
 *   - ./googleAuth
 *
 * References
 *   - https://developers.google.com/sheets/api/samples/rowcolumn?hl=ko
 *   - https://stackoverflow.com/questions/74349894/update-cells-formatting-with-the-google-sheets-api-wrapping-and-alignment
 *   - https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets?hl=ko
 *   - https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request?hl=ko
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
export const arrToCell = (arr = [2, 4]) => {
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
export const cellToArr = (cell = "A1") => {
  if (Array.isArray(cell)) return cell;

  // let [_, columnName, row] = cell.toUpperCase().match(/([A-Z]+)([0-9]+)/);
  const matched: RegExpMatchArray | null = cell.toUpperCase().match(/([A-Z]+)([0-9]+)/);
  const [_, columnName, row] = matched!;
  const characters = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;

  let columnNum = 0;
  columnName.split("").forEach((char: string) => {
    columnNum *= characters;
    columnNum += char.charCodeAt(0) - "A".charCodeAt(0) + 1;
  });

  return [parseInt(row), columnNum];
};

/** rangeByStart
 * @example
 *  rangeByStart(start = [3, 2], size = [1, 2])
 *  => "B3:C5"
 */
const rangeByStart = (start = [3, 2], size = [1, 2]) => {
  return `${arrToCell(start)}:${arrToCell([start[0] + size[0], start[1] + size[1]])}`;
};

const getCellCoords = (cell: string) => {
  const match = cell.toUpperCase().match(/([A-Z]+)(\d+)/);
  if (match) {
    const [, col, row] = match;
    const colIndex = col.split("").reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
    const rowIndex = parseInt(row, 10) - 1;
    return { colIndex, rowIndex };
  }
};

const getGridRangeFromRange = (range: string) => {
  const [start, end] = range.split(":");
  const startCell = getCellCoords(start);
  const endCell = getCellCoords(end);

  return {
    startRowIndex: startCell!.rowIndex,
    endRowIndex: endCell!.rowIndex + 1,
    startColumnIndex: startCell!.colIndex,
    endColumnIndex: endCell!.colIndex + 1,
  };
};

const hexToDecimal = (hex: string) => parseInt(hex, 16) / 255;

const RgbFromHex = (hex: string) => {
  return {
    red: hexToDecimal(hex.slice(1, 3)),
    green: hexToDecimal(hex.slice(3, 5)),
    blue: hexToDecimal(hex.slice(5, 7)),
  };
};

const borderObject_ = (setting: any) => {
  return {
    style: setting.style, // DOTTED, DASHED, SOLID, SOLID_MEDIUM, SOLID_THICK, DOUBLE, NONE
    color: RgbFromHex(setting.color),
  };
};

// & Class AREA
// &---------------------------------------------------------------------------
export class GoogleSheets {
  service: any;
  googleAuth;
  spreadsheetId;

  // * CONSTRUCTOR
  /** GoogleAuth 참조(googleAuth.ts)
   */
  constructor({ spreadsheetId, user = "bigwhitekmc", type = "oauth2", sn = 0 }: { spreadsheetId: string; user?: string; type?: string; sn?: number }) {
    this.googleAuth = new GoogleAuth(user, type, sn);
    this.spreadsheetId = spreadsheetId;
  }

  /** init
   */
  async init() {
    const auth = await this.googleAuth.authorize();
    this.service = google.sheets({ version: "v4", auth });
  }

  // * GOOGLESHEETS
  // * CRUD
  /** getSheetNames
   *   googleSheets 내에 있는 sheetName
   * @param all: true(전체 시트) | false(`_`로 시작하는 sheet 제외)
   */
  getSheetNames = async (all = false) => {
    const res = await this.service.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    let names = res.data?.sheets?.map((sheet: any) => sheet?.properties?.title);
    return all ? names : names?.filter((name: any) => !name?.startsWith("_")); // all: false => `_`로 시작하는 sheet 제외
  };

  getSheetId = async (sheetName: string) => {
    const sheetMetadata = await this.service.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "sheets.properties",
    });
    const sheets = sheetMetadata.data.sheets;
    if (!sheets) {
      return "";
    }
    const sheet: any = sheets!.find((s: any) => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }

    return sheet.properties.sheetId;
  };

  /** getValues
   *   googleSheets(`spreadsheetId`) 내에 있는 `sheetName`의 시트에서 `range`에 해당하는 Data(rows) 반환
   */
  getValues = async ({ range = "", sheetName = "" }) => {
    const res = await this.service.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
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
  setValues = async ({
    values = [[]],
    start = "A1",
    sheetName = "",
    valueInputOption = "USER_ENTERED",
  }: {
    values: any[][];
    start?: string;
    sheetName?: string;
    valueInputOption?: string;
  }) => {
    const range = rangeByStart(cellToArr(start), [values.length, values[0].length]);
    await this.service.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: range ? `${sheetName}!${range}` : sheetName,
      valueInputOption: valueInputOption, // "RAW" / "USER_ENTERED"
      requestBody: {
        values: values as never[][], // [["hello", "world"]]
        // values: values as any[][] | null, // [["hello", "world"]]
      },
    });
  };

  /** appendValues
   *   googleSheets(`spreadsheetId`) 내에 있는 `sheetName`의 시트에 기존 내용 뒤에 data(`values`, arrays of array)를 추가(update)
   */
  appendValues = async ({
    values = [[]],
    start = "A1",
    sheetName = "",
    valueInputOption = "USER_ENTERED",
  }: {
    values: any[][];
    start?: string;
    sheetName?: string;
    valueInputOption?: string;
  }) => {
    const range = rangeByStart(cellToArr(start), [values.length, values[0].length]);
    await this.service.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: range ? `${sheetName}!${range}` : sheetName,
      valueInputOption: valueInputOption, // "RAW" / "USER_ENTERED"
      requestBody: {
        values: values, // [["hello", "world"]]
      },
    });
  };

  // * 서식 design
  rangeObject_ = async (sheetName: string, range: number[]) => {
    return {
      sheetId: await this.getSheetId(sheetName),
      startRowIndex: range[0],
      endRowIndex: range[2],
      startColumnIndex: range[1],
      endColumnIndex: range[3],
    };
  };

  setRowHeights = async ({
    startRowIndex = 0,
    endRowIndex = 10,
    height = 20,
    sheetName = "",
  }: {
    startRowIndex?: number;
    endRowIndex?: number;
    height?: number;
    sheetName: string;
  }) => {
    const rowHeightsRequest = {
      updateDimensionProperties: {
        range: {
          sheetId: await this.getSheetId(sheetName),
          dimension: "ROWS",
          startIndex: startRowIndex,
          endIndex: endRowIndex + 1, // Google Sheets API endIndex is exclusive
        },
        properties: {
          pixelSize: height,
        },
        fields: "pixelSize",
      },
    };

    await this.service.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [rowHeightsRequest],
      },
    });
  };

  setColumnWidths = async ({
    startColumnIndex = 0,
    endColumnIndex = 10,
    width = 100,
    sheetName = "",
  }: {
    startColumnIndex?: number;
    endColumnIndex?: number;
    width?: number;
    sheetName: string;
  }) => {
    const columnWidthsRequest = {
      updateDimensionProperties: {
        range: {
          sheetId: await this.getSheetId(sheetName),
          dimension: "COLUMNS",
          startIndex: startColumnIndex,
          endIndex: endColumnIndex + 1, // Google Sheets API endIndex is exclusive
        },
        properties: {
          pixelSize: width,
        },
        fields: "pixelSize",
      },
    };

    await this.service.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [columnWidthsRequest],
      },
    });
  };

  setVerticalAlign = async ({
    range = [0, 0, 100, 100],
    sheetName,
    wrapStrategy = "WRAP",
    verticalAlignment = "middle",
  }: {
    range?: number[];
    sheetName: string;
    wrapStrategy?: string;
    verticalAlignment?: string;
  }) => {
    const verticalAlignRequest = {
      repeatCell: {
        range: await this.rangeObject_(sheetName, range),
        cell: {
          userEnteredFormat: {
            wrapStrategy: wrapStrategy,
            verticalAlignment: verticalAlignment,
          },
        },
        fields: "userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment",
      },
    };

    await this.service.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [verticalAlignRequest],
      },
    });
  };

  setBasicFormat = async ({
    range = [0, 0, 100, 100],
    sheetName,
    horizontalAlignment = "left",
    fontSize = 10,
    bold = false,
    backgroundColor = "#ffffff",
    foregroundColor = "#000000",
  }: {
    range?: number[];
    sheetName: string;
    horizontalAlignment?: string;
    fontSize?: number;
    bold?: boolean;
    backgroundColor?: string;
    foregroundColor?: string;
  }) => {
    const colorRequest = {
      repeatCell: {
        range: await this.rangeObject_(sheetName, range),
        cell: {
          userEnteredFormat: {
            backgroundColor: RgbFromHex(backgroundColor),
            horizontalAlignment: horizontalAlignment,
            textFormat: {
              foregroundColor: RgbFromHex(foregroundColor),
              fontSize: fontSize,
              bold: bold,
            },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    };

    await this.service.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [colorRequest],
      },
    });
  };

  setBorders = async ({
    range = [0, 0, 100, 100],
    sheetName = "",
    top = { style: "SOLID", color: "#ff0000" },
    bottom = { style: "SOLID", color: "#0000ff" },
    left = { style: "SOLID", color: "#00ff00" },
    right = { style: "SOLID", color: "#000000" },
    innerHorizontal = { style: "SOLID", color: "#000000" },
    innerVertical = { style: "SOLID", color: "#000000" },
  }: {
    range?: number[];
    sheetName: string;
    top?: any;
    bottom?: any;
    left?: any;
    right?: any;
    innerHorizontal?: any;
    innerVertical?: any;
  }) => {
    const bordersRequest = {
      updateBorders: {
        range: await this.rangeObject_(sheetName, range),
        top: borderObject_(top),
        bottom: borderObject_(bottom),
        left: borderObject_(left),
        right: borderObject_(right),
        innerHorizontal: borderObject_(innerHorizontal),
        innerVertical: borderObject_(innerVertical),
      },
    };

    await this.service.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [bordersRequest],
      },
    });
  };
}

// & Test AREA
// &---------------------------------------------------------------------------
// const spreadsheetId = "13Y3q2mYpGRIIjD2oJZu5YvLIXkQB0jDaHDICNnLqLgE";
// const googleSheets = new GoogleSheets({ spreadsheetId });
// await googleSheets.init();

// const names = await googleSheets.getSheetNames();
// console.log(names);

// // // * Get Values
// // const range = "A2:B5";
// // const sheetName = "예시";
// // const values = await googleSheets.getValues({ range, sheetName });
// // console.log("values", values);

// // // * Set Values
// // const start = 'F5';
// // const values = [["hello", "world"]];
// // const sheetName = 'Sheet2';
// // const spreadsheetId = '14HsVYROe_RDI2zg6C1S8uAYUen4a7wIh0_p7VTtxn-A';
// // await googleSheets.setValues({values, start, sheetName, spreadsheetId});
