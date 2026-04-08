/**
 * data.js — UK bank holiday dates and names
 *
 * To keep this up to date automatically, replace the hardcoded BH_DATA object
 * with a fetch() call to the official government API:
 *   https://www.gov.uk/bank-holidays.json
 *
 * The API returns data in a slightly different shape, so you'd need a small
 * adapter function to transform it into the format below. The hardcoded data
 * is provided here as a reliable fallback.
 */

const BH_DATA = {
  2025: {
    ew: [
      "2025-01-01", // New Year's Day
      "2025-04-18", // Good Friday
      "2025-04-21", // Easter Monday
      "2025-05-05", // Early May bank holiday
      "2025-05-26", // Spring bank holiday
      "2025-08-25", // Summer bank holiday
      "2025-12-25", // Christmas Day
      "2025-12-26"  // Boxing Day
    ],
    sc: [
      "2025-01-01", // New Year's Day
      "2025-01-02", // 2nd January
      "2025-04-18", // Good Friday
      "2025-05-05", // Early May bank holiday
      "2025-05-26", // Spring bank holiday
      "2025-08-25", // Summer bank holiday
      "2025-12-01", // St Andrew's Day (substitute)
      "2025-12-25", // Christmas Day
      "2025-12-26"  // Boxing Day
    ],
    ni: [
      "2025-01-01", // New Year's Day
      "2025-03-17", // St Patrick's Day (substitute)
      "2025-04-18", // Good Friday
      "2025-04-21", // Easter Monday
      "2025-05-05", // Early May bank holiday
      "2025-05-26", // Spring bank holiday
      "2025-07-14", // Battle of the Boyne (substitute)
      "2025-08-25", // Summer bank holiday
      "2025-12-25", // Christmas Day
      "2025-12-26"  // Boxing Day
    ]
  },
  2026: {
    ew: [
      "2026-01-01", // New Year's Day
      "2026-04-03", // Good Friday
      "2026-04-06", // Easter Monday
      "2026-05-04", // Early May bank holiday
      "2026-05-25", // Spring bank holiday
      "2026-08-31", // Summer bank holiday
      "2026-12-25", // Christmas Day
      "2026-12-28"  // Boxing Day (substitute)
    ],
    sc: [
      "2026-01-01", // New Year's Day
      "2026-01-02", // 2nd January
      "2026-04-03", // Good Friday
      "2026-05-04", // Early May bank holiday
      "2026-05-25", // Spring bank holiday
      "2026-08-31", // Summer bank holiday
      "2026-11-30", // St Andrew's Day
      "2026-12-25", // Christmas Day
      "2026-12-28"  // Boxing Day (substitute)
    ],
    ni: [
      "2026-01-01", // New Year's Day
      "2026-03-17", // St Patrick's Day
      "2026-04-03", // Good Friday
      "2026-04-06", // Easter Monday
      "2026-05-04", // Early May bank holiday
      "2026-05-25", // Spring bank holiday
      "2026-07-13", // Battle of the Boyne (substitute)
      "2026-08-31", // Summer bank holiday
      "2026-12-25", // Christmas Day
      "2026-12-28"  // Boxing Day (substitute)
    ]
  }
};

const BH_NAMES = {
  "2025-01-01": "New Year's Day",
  "2025-01-02": "2nd January",
  "2025-03-17": "St Patrick's Day (sub)",
  "2025-04-18": "Good Friday",
  "2025-04-21": "Easter Monday",
  "2025-05-05": "Early May bank holiday",
  "2025-05-26": "Spring bank holiday",
  "2025-07-14": "Battle of the Boyne (sub)",
  "2025-08-25": "Summer bank holiday",
  "2025-12-01": "St Andrew's Day (sub)",
  "2025-12-25": "Christmas Day",
  "2025-12-26": "Boxing Day",

  "2026-01-01": "New Year's Day",
  "2026-01-02": "2nd January",
  "2026-03-17": "St Patrick's Day",
  "2026-04-03": "Good Friday",
  "2026-04-06": "Easter Monday",
  "2026-05-04": "Early May bank holiday",
  "2026-05-25": "Spring bank holiday",
  "2026-07-13": "Battle of the Boyne (sub)",
  "2026-08-31": "Summer bank holiday",
  "2026-11-30": "St Andrew's Day",
  "2026-12-25": "Christmas Day",
  "2026-12-28": "Boxing Day (sub)"
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
