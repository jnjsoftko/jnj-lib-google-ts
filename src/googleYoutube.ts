// &---------------------------------------------------------------------------
// ? Builtin Modules

// ? External Modules
import { google } from "googleapis";

// ? UserMade Modules
// ? Local Modules
import { GoogleAuth } from "./googleAuth.js";

// & Function AREA
// &---------------------------------------------------------------------------
// Constants for snippet keys
const snippetKeys: string[] = ["channelId", "publishedAt", "title", "description", "thumbnail"];

// Function to flatten snippet object
function flattenSnippet(snippet: Record<string, any> = {}, keys = snippetKeys, thumbnail = "high"): Record<string, any> {
  const dct: Record<string, any> = {};
  for (const key of keys) {
    if (key === "thumbnail") {
      try {
        dct[key] = `=image("${snippet["thumbnails"][thumbnail]["url"]}")`;
      } catch {
        dct[key] = "";
      }
    } else if (key.endsWith("_ko")) {
      dct[key.slice(0, -2)] = snippet["localized"][key.split("_")[0]];
    } else {
      dct[key] = snippet[key];
    }
  }
  return dct;
}

export class Youtube {
  service: any;
  googleAuth;

  // * CONSTRUCTOR
  /** GoogleAuth 참조(googleAuth.ts)
   */
  constructor(user = "bigwhitekmc", type = "oauth2", sn = 0) {
    this.googleAuth = new GoogleAuth(user, type, sn);
  }

  /** init
   */
  async init() {
    const auth = await this.googleAuth.authorize();
    this.service = google.youtube({ version: "v3", auth });
  }

  async search(options: { q?: string; order?: string; part?: string[]; maxResults?: number } = {}): Promise<any> {
    const q = options.q || "gemini";
    const order = options.order || "relevance";
    const part = options.part || "snippet".split(",");
    const maxResults = options.maxResults || 100;

    const response = await this.service.search.list({
      q,
      order,
      part,
      maxResults,
    });

    return response.data.items;
  }

  async channelIdByCustomUrl(customUrl: string): Promise<string> {
    customUrl = customUrl.startsWith("@") ? customUrl.substring(1) : customUrl;
    const s: any[] = await this.search({ q: customUrl });
    return s[0]["id"]["channelId"];
  }

  async subscriptions_(): Promise<any[]> {
    const subscriptions: any[] = [];
    let nextPageToken: string | null | undefined;

    do {
      const response = await this.service.subscriptions.list({
        part: "id,snippet".split(","),
        mine: true,
        maxResults: 50,
        pageToken: nextPageToken || undefined, // null이면 undefined로 전달
      });

      subscriptions.push(...(response.data.items as any[]));
      nextPageToken = response.data.nextPageToken || undefined; // null이면 undefined로 할당
    } while (nextPageToken);

    return subscriptions;
  }

  async subscriptions(): Promise<any[]> {
    const items = await this.subscriptions_();
    const dicts: any[] = [];
    for (const item of items) {
      const dct = { id: item["id"] };
      Object.assign(dct, flattenSnippet(item["snippet"]));
      dicts.push(dct);
    }
    return dicts;
  }

  // async subscriptions(options: { part?: string[]; mine?: boolean; maxResults?: number } = {}): Promise<any[]> {
  //   const part = options.part || "id,snippet".split(",");
  //   const mine = options.mine || true;
  //   const maxResults = options.maxResults || 50;

  //   const response = await this.service.subscriptions.list({
  //     part,
  //     mine,
  //     maxResults,
  //   });

  //   let items = response.data.items;
  //   if (items == undefined || items.length == 0) {
  //     return [];
  //   }

  //   const dicts: any[] = [];
  //   for (const item of items) {
  //     const dct = { id: item["id"] };
  //     Object.assign(dct, flattenSnippet(item["snippet"]));
  //     dicts.push(dct);
  //   }
  //   return dicts;
  // }

  async channelInfo_(channelId: string): Promise<any[]> {
    const response = await this.service.channels.list({
      part: "snippet,contentDetails".split(","),
      id: channelId.split(","),
      maxResults: 25,
    });

    let items = response.data.items;
    if (items == undefined || items.length == 0) {
      return [];
    }

    return items;
  }

  async channelInfo(channelId: string, thumbnail = "high"): Promise<any> {
    const infos = await this.channelInfo_(channelId);
    const info = infos[0];
    const related = info["contentDetails"]["relatedPlaylists"];

    const dct = { channelId, likes: "", uploads: "" };
    Object.assign(dct, flattenSnippet(info["snippet"], ["customUrl", ...snippetKeys.slice(1), "title_ko", "description_ko"], thumbnail));
    dct["likes"] = related["likes"];
    dct["uploads"] = related["uploads"];
    return dct;
  }

  async channelInfoByCustomUrl(customUrl: string, thumbnail = "high"): Promise<any> {
    return this.channelInfo(await this.channelIdByCustomUrl(customUrl), thumbnail);
  }

  async channelPlaylists_(channelId: string): Promise<any[]> {
    const playlists: any[] = [];
    let nextPageToken: string | null | undefined;

    do {
      const response = await this.service.playlists.list({
        part: "snippet,contentDetails".split(","),
        channelId,
        maxResults: 50,
        pageToken: nextPageToken || undefined, // null이면 undefined로 전달
      });

      playlists.push(...(response.data.items as any[]));
      nextPageToken = response.data.nextPageToken || undefined; // null이면 undefined로 할당
    } while (nextPageToken);

    return playlists;
  }

  async channelPlaylists(channelId: string, thumbnail = "high"): Promise<any[]> {
    const dicts: any[] = [];
    for (const item of await this.channelPlaylists_(channelId)) {
      const dct = { playlistId: item["id"], itemCount: 0 };
      Object.assign(dct, flattenSnippet(item["snippet"], snippetKeys.concat(["title_ko", "description_ko"]), thumbnail));
      dct["itemCount"] = item["contentDetails"]["itemCount"];
      dicts.push(dct);
    }
    return dicts;
  }

  async channelPlaylistsByCustomUrl(customUrl: string): Promise<any[]> {
    return await this.channelPlaylists(await this.channelIdByCustomUrl(customUrl));
  }

  async videosByPlaylist_(playlistId: string): Promise<any[]> {
    const videos: any[] = [];
    let nextPageToken: string | null | undefined;

    do {
      let response = await this.service.playlistItems.list({
        part: "snippet,contentDetails".split(","),
        playlistId,
        maxResults: 50, // API maximum limit
        pageToken: nextPageToken || undefined, // null이면 undefined로 전달
      });

      videos.push(...(response.data.items as any[]));
      nextPageToken = response.data.nextPageToken || undefined; // null이면 undefined로 할당
    } while (nextPageToken);

    return videos;
  }

  async videosByPlaylist(playlistId: string, thumbnail = "high"): Promise<any[]> {
    const dicts: any[] = [];
    for (const item of await this.videosByPlaylist_(playlistId)) {
      const dct = { videoId: item["contentDetails"]["videoId"] };
      Object.assign(dct, flattenSnippet(item["snippet"], snippetKeys, thumbnail));
      dicts.push(dct);
    }
    return dicts;
  }
}

// & Test AREA
// &---------------------------------------------------------------------------
// const youtube = new Youtube("bigwhitekmc");
// await youtube.init();

// // * subscriptions
// const subscriptions = await youtube.subscriptions();
// console.log(subscriptions);
// console.log(subscriptions.length);

// // // * search
// // const videos = await youtube.search();
// // const channelId = await youtube.channelIdByCustomUrl("@darkgreenchloeJJ-pe6gq");
// // console.log(channelId);

// // // * channelPlaylists
// // const list = await youtube.channelPlaylists(channelId);
// // console.log(list);
// // console.log(list.length);

// // // * videosByPlaylist
// // const playlistId = "PLnAbm0LaZMdMhg5yCz33RiVvEM8pAMb5b";
// // const videos = await youtube.videosByPlaylist(playlistId);
// // // console.log(videos);
// // console.log(videos.length);
