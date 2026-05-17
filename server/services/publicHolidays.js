const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { fetchIndiaHolidaysFromGoogle } = require('./indiaHolidayIcal');

const DEFAULT_COUNTRY = (process.env.HOLIDAY_COUNTRY_CODE || 'IN').toUpperCase();
const fallbackData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/india-holidays-fallback.json'), 'utf8')
);

async function fetchFromNager(year, countryCode) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Nager API ${res.status}`);
  const text = await res.text();
  if (!text?.trim()) throw new Error('Nager API empty response');
  const data = JSON.parse(text);
  if (!Array.isArray(data) || !data.length) throw new Error('Nager API returned no holidays');
  return data.map((h) => ({
    date: h.date,
    name: h.localName || h.name,
  }));
}

function fetchFromFallback(year) {
  const list = fallbackData[String(year)];
  if (!list?.length) return [];
  return list.map((h) => ({ date: h.date, name: h.name }));
}

async function fetchPublicHolidays(year, countryCode = DEFAULT_COUNTRY) {
  if (countryCode !== 'IN') {
    return fetchFromNager(year, countryCode);
  }

  const errors = [];
  try {
    const google = await fetchIndiaHolidaysFromGoogle(year);
    if (google.length) return google;
    errors.push('Google iCal returned no events for year');
  } catch (err) {
    errors.push(`Google iCal: ${err.message}`);
  }

  try {
    return await fetchFromNager(year, 'IN');
  } catch (err) {
    errors.push(`Nager: ${err.message}`);
  }

  const fallback = fetchFromFallback(year);
  if (fallback.length) {
    console.warn('Using built-in India holiday fallback for', year, errors.join('; '));
    return fallback;
  }

  throw new Error(errors.join('; ') || 'No holiday source available');
}

async function syncNationalHolidays(year, countryCode = DEFAULT_COUNTRY) {
  const holidays = await fetchPublicHolidays(year, countryCode);

  await query(
    `DELETE FROM holidays
     WHERE is_national = true
       AND plant_id IS NULL
       AND EXTRACT(YEAR FROM holiday_date) = $1`,
    [year]
  );

  let synced = 0;
  for (const h of holidays) {
    await query(
      `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national)
       VALUES ($1::date, $2, NULL, true)`,
      [h.date, h.name]
    );
    synced += 1;
  }

  return { year, countryCode, synced, source: countryCode === 'IN' ? 'india' : 'nager' };
}

module.exports = { syncNationalHolidays, fetchPublicHolidays, DEFAULT_COUNTRY };
