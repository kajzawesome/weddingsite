/*
  "Add to Google Calendar" link. Google opens a pre-filled event from these
  URL parameters, so it works from any email app with no attachment or login
  on our side. Times are sent in UTC (the trailing Z).
*/

type CalendarEvent = {
  title: string;
  start: string; // ISO date ("2027-06-12") or date-time with offset
  end?: string | null;
  location?: string | null;
  details?: string;
};

const HOURS = 60 * 60 * 1000;
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

export function googleCalendarUrl(e: CalendarEvent) {
  const allDay = /^\d{4}-\d{2}-\d{2}$/.test(e.start);
  const start = new Date(e.start);
  let dates: string;
  if (allDay) {
    // All-day events end on the next day (Google's end date is exclusive).
    dates = `${day(start)}/${day(new Date(start.getTime() + 24 * HOURS))}`;
  } else {
    const end = e.end ? new Date(e.end) : new Date(start.getTime() + 6 * HOURS);
    dates = `${utc(start)}/${utc(end)}`;
  }

  const params = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates });
  if (e.details) params.set("details", e.details);
  if (e.location) params.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}
