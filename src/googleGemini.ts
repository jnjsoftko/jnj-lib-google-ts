/** googleAuth
 *
 * Description
 *   - A Class For Google Gemini
 *
 * Functions
 *   [X]
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install @google/generative-ai
 *   - npm install -D dotenv jnj-lib-base jnj-lib-doc
 *
 * References
 *   - https://ai.google.dev/tutorials/get_started_node?hl=ko
 *
 * Authors
 *   - Moon In Learn <mooninlearn@gmail.com>
 *   - JnJsoft Ko <jnjsoft.ko@gmail.com>
 */

// & Import AREA
// &---------------------------------------------------------------------------
// ? Builtin Modules

import Path from "path";

// ? External Modules
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ? UserMade Modules
import { loadJson, saveJson } from "jnj-lib-base";
import { loadYaml } from "jnj-lib-doc";

// & Variable AREA
// &---------------------------------------------------------------------------
dotenv.config(); // 실행 경로에 있는 `.env`

const settingsPath = process.env.DEV_SETTINGS ?? "C:/JnJ-soft/Developments/_Settings";

const accounts: any = loadYaml(`${settingsPath}/Apis/ai/gemini/accounts.yaml`);

// & Class AREA
// &---------------------------------------------------------------------------
export class GoogleGemini {
  apiKey;
  genAI;
  model;

  // generationConfig = {
  //   stopSequences: ["red"],
  //   maxOutputTokens: 200,
  //   temperature: 0,
  //   topP: 0.1,
  //   topK: 16,
  // },

  // & CONSTRUCTOR
  constructor({
    user = "bigwhitekmc",
    model = "gemini-pro",
    generationConfig = {
      temperature: 0,
      topP: 0.1,
      topK: 16,
    },
  } = {}) {
    // "gemini-pro"
    this.apiKey = accounts[user]["api_key"];
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model, generationConfig });
  }

  // &
  answer = async (prompt: string) => {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  };
}

// & Test AREA
// &---------------------------------------------------------------------------
// // console.log(accounts);

// const gem = new GoogleGemini();
// // console.log(gem.apiKey);
// const prompt = "2025년 한국의 거시 경제를 예측해줄 수 있어?";
// const ans = await gem.answer(prompt);
// console.log(ans);
