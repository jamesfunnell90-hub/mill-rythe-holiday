import { PARK, DAYS } from './data.js';

const KEY = 'mrh:weather';
const URL_ = 'https://api.open-meteo.com/v1/forecast?latitude=' + PARK.lat + '&longitude=' + PARK.lon +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max,precipitation_probability_max' +
  '&hourly=precipitation_probability,wind_gusts_10m&temperature_unit=celsius&wind_speed_unit=mph&timezone=Europe%2FLondon' +
  '&start_date=' + DAYS[0].date + '&end_date=' + DAYS[DAYS.length - 1].date;

export const state = { data: null, at: null, stale: false };

try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c) { state.data = c.data; state.at = c.at; state.stale = true; } } catch (e) { /* ignore */ }

export async function refresh() {
  try {
    const r = await fetch(URL_, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (!data.daily || !data.hourly) throw new Error('bad payload');
    state.data = data; state.at = Date.now(); state.stale = false;
    try { localStorage.setItem(KEY, JSON.stringify({ data, at: state.at })); } catch (e) { /* ignore */ }
  } catch (e) {
    state.stale = true;
    console.warn('weather fetch failed', e);
  }
  return state;
}

const CODES = [[0, 'Clear'], [1, 'Mainly clear'], [2, 'Partly cloudy'], [3, 'Overcast'], [45, 'Fog'], [48, 'Fog'], [51, 'Light drizzle'], [53, 'Drizzle'], [55, 'Heavy drizzle'], [56, 'Freezing drizzle'], [57, 'Freezing drizzle'], [61, 'Light rain'], [63, 'Rain'], [65, 'Heavy rain'], [66, 'Freezing rain'], [67, 'Freezing rain'], [71, 'Light snow'], [73, 'Snow'], [75, 'Heavy snow'], [77, 'Snow grains'], [80, 'Light showers'], [81, 'Showers'], [82, 'Heavy showers'], [85, 'Snow showers'], [86, 'Snow showers'], [95, 'Thunderstorm'], [96, 'Thunderstorm with hail'], [99, 'Thunderstorm with hail']];
export const codeText = (c) => (CODES.find((x) => x[0] === c) || [0, 'Unknown'])[1];

export function forDay(date) {
  const d = state.data; if (!d) return null;
  const i = d.daily.time.indexOf(date); if (i < 0) return null;
  const hours = [];
  d.hourly.time.forEach((t, k) => { if (t.startsWith(date)) { const h = +t.slice(11, 13); if (h >= 8 && h <= 20) hours.push({ h, rain: d.hourly.precipitation_probability[k], gust: d.hourly.wind_gusts_10m[k] }); } });
  return {
    summary: codeText(d.daily.weather_code[i]), hi: Math.round(d.daily.temperature_2m_max[i]), lo: Math.round(d.daily.temperature_2m_min[i]),
    gust: Math.round(d.daily.wind_gusts_10m_max[i]), rain: d.daily.precipitation_probability_max[i],
    sunrise: d.daily.sunrise[i].slice(11, 16), sunset: d.daily.sunset[i].slice(11, 16), hours
  };
}
