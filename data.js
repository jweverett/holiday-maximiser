const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const BH_NAMES = {};
const BH_DATA = { 2025: {}, 2026: {} };

async function loadBankHolidays() {
  const response = await fetch("https://www.gov.uk/bank-holidays.json");
  const json = await response.json();

  const regionMap = {
    "england-and-wales": "ew",
    "scotland": "sc",
    "northern-ireland": "ni"
  };

  for (const [apiKey, shortKey] of Object.entries(regionMap)) {
    const events = json[apiKey].events;

    for (const event of events) {
      const date = event.date;         // e.g. "2026-04-03"
      const year = parseInt(date.slice(0, 4));

      BH_NAMES[date] = event.title;

      if (!BH_DATA[year]) BH_DATA[year] = {};
      if (!BH_DATA[year][shortKey]) BH_DATA[year][shortKey] = [];
      BH_DATA[year][shortKey].push(date);
    }
  }
}