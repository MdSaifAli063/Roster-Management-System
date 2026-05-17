const GOOGLE_INDIA_ICAL =
  'https://www.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics';

let cachedRaw = null;
let cachedAt = 0;
const CACHE_MS = 12 * 60 * 60 * 1000;

async function fetchIcalText() {
  if (cachedRaw && Date.now() - cachedAt < CACHE_MS) {
    return cachedRaw;
  }
  const res = await fetch(GOOGLE_INDIA_ICAL, {
    signal: AbortSignal.timeout(20000),
    headers: { Accept: 'text/calendar' },
  });
  if (!res.ok) {
    throw new Error(`India holiday calendar feed returned ${res.status}`);
  }
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('Invalid iCal response');
  }
  cachedRaw = text;
  cachedAt = Date.now();
  return text;
}

/** Parse Google India public holiday iCal into { date, name }[]. */
function parseIcalEvents(icalText, year) {
  const events = [];
  const blocks = icalText.split('BEGIN:VEVENT');

  for (const block of blocks.slice(1)) {
    const startMatch =
      block.match(/DTSTART;VALUE=DATE:(\d{8})/) || block.match(/DTSTART:(\d{8})/);
    const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
    if (!startMatch || !summaryMatch) continue;

    const raw = startMatch[1];
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    if (Number(date.slice(0, 4)) !== Number(year)) continue;

    const name = summaryMatch[1].trim();
    if (!name) continue;

    events.push({ date, name, localName: name });
  }

  const byDate = new Map();
  events.forEach((e) => byDate.set(e.date, e));
  return [...byDate.values()];
}

async function fetchIndiaHolidaysFromGoogle(year) {
  const ical = await fetchIcalText();
  return parseIcalEvents(ical, year);
}

module.exports = { fetchIndiaHolidaysFromGoogle, parseIcalEvents, GOOGLE_INDIA_ICAL };
