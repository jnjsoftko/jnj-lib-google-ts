/** googleCalendar
 *
 * Description
 *   - A Class For Handling GoogleCalendar
 *
 * Functions
 *   [X] Authentication for GoogleCalendar
 *   [] listCalendars
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install googleapis
 *   - ./googleAuth
 *
 * References
 *   - https://developers.google.com/calendar/api/quickstart/nodejs?hl=ko
 *   - https://developers.google.com/calendar/api/reference/rest?hl=ko
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
export class GoogleCalendar {
  service: any;
  googleAuth;

  // * CONSTRUCTOR
  /** GoogleAuth 참조(googleAuth.ts)
   */
  constructor(user: string, type: string = "oauth2", sn: number = 0) {
    this.googleAuth = new GoogleAuth(user, type, sn);
  }

  /** init
   */
  async init() {
    const auth = await this.googleAuth.authorize();
    this.service = google.calendar({ version: "v3", auth });
  }

  /** listCalendars
   */
  listCalendars = async () => {
    const service = await this.service;
    const res = await service.calendarList.list();
    const calendars = res.data.items;
    if (!calendars || calendars.length === 0) {
      console.log("No calendars found.");
      return;
    }
    console.log("Calendars:");
    calendars.forEach((calendar: any) => {
      console.log(`${calendar.id} - ${calendar.summary}`);
    });
  };

  /** listEvents
   */
  listEvents = async () => {
    const service = await this.service;
    const res = await service.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log("No upcoming events found.");
      return;
    }
    console.log("Upcoming 10 events:");
    events.map((event: any, i: number) => {
      const start = event.start!.dateTime || event.start!.date;
      console.log(`${start} - ${event.summary}`);
    });
  };

  /** createEvent
   */
  createEvent = async (summary: any, startTime: any, endTime: any) => {
    const service = await this.service;
    const event = {
      summary: summary,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
    };
    const res = await service.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    console.log(`Event created: ${res.data.htmlLink}`);
  };

  updateEvent = async (eventId: any, summary: any, startTime: any, endTime: any) => {
    const service = await this.service;
    const event = {
      summary: summary,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
    };
    const res = await service.events.update({
      calendarId: "primary",
      eventId: eventId,
      requestBody: event,
    });
    console.log(`Event updated: ${res.data.htmlLink}`);
  };

  deleteEvent = async (eventId: any) => {
    const service = await this.service;
    await service.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
    console.log(`Event deleted: ${eventId}`);
  };
}

// & Test AREA
// &---------------------------------------------------------------------------
// const calendar = new GoogleCalendar("bigwhitekmc");
// await calendar.init();

// // * googleCalendar 테스트
// await calendar.listCalendars();
// // await calendar.listEvents();
