/**
 * app.js — UK Leave Optimiser
 *
 * Depends on: data.js (BH_DATA, BH_NAMES, MONTH_NAMES, DAY_NAMES)
 *
 * ─── State ────────────────────────────────────────────────────
 */
let workDays = [1, 2, 3, 4, 5]; // 1=Mon ... 7=Sun
let manualTakenDates = new Set();
let pendingSelection = new Set();
let suggestedDates = new Set();

let dpYear = 2026;
let dpMonth = 0;

let isDragging = false;
let dragStartDate = null;
let dragMode = null; // "add" | "remove"


/* ─── Date helpers ────────────────────────────────────────────── */

function mkDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function dayOfWeek(d) {
  // Returns 1 (Mon) – 7 (Sun)
  const x = d.getDay();
  return x === 0 ? 7 : x;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getDatesInRange(s1, s2) {
  const a = mkDate(s1), b = mkDate(s2);
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const result = [];
  let cur = new Date(lo);
  while (cur <= hi) {
    result.push(fmtDate(cur));
    cur = addDays(cur, 1);
  }
  return result;
}


/* ─── Bank holiday helpers ────────────────────────────────────── */

function getAllBHSet() {
  const region = document.getElementById("regionSel").value;
  const all = [
    ...(BH_DATA[2025]?.[region] || []),
    ...(BH_DATA[2026]?.[region] || [])
  ];
  return new Set(all);
}

function getBankHolidaysInWindow() {
  const allBH = getAllBHSet();
  const { start, end } = getYearWindow();
  return [...allBH].filter(s => {
    const d = mkDate(s);
    return d >= start && d <= end;
  });
}


/* ─── Holiday year window ─────────────────────────────────────── */

function getYearWindow() {
  const base = parseInt(document.getElementById("calYearSel").value);
  const yt = document.getElementById("yearTypeSel").value;
  let startMonth = 0;
  if (yt === "apr") startMonth = 3;
  else if (yt === "custom") startMonth = parseInt(document.getElementById("customMonth").value) || 0;

  const start = new Date(base, startMonth, 1);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return { start, end };
}


/* ─── Working day check ───────────────────────────────────────── */

function isWorkDay(d) {
  return workDays.includes(dayOfWeek(d));
}

function isPickable(s) {
  const allBH = getAllBHSet();
  const d = mkDate(s);
  return isWorkDay(d) && !allBH.has(s);
}


/* ─── Working day buttons ─────────────────────────────────────── */

function renderDayBtns() {
  const container = document.getElementById("dayBtns");
  container.innerHTML = "";

  DAY_NAMES.forEach((name, i) => {
    const wd = i + 1;
    const isWork = workDays.includes(wd);
    const btn = document.createElement("button");
    btn.className = "day-btn " + (isWork ? "work" : "off");
    btn.innerHTML = `${name}<div class="day-label">${isWork ? "working" : "day off"}</div>`;
    btn.addEventListener("click", () => {
      if (workDays.includes(wd)) {
        if (workDays.length > 1) workDays = workDays.filter(x => x !== wd);
      } else {
        workDays.push(wd);
        workDays.sort();
      }
      renderDayBtns();
      rebuild();
    });
    container.appendChild(btn);
  });
}


/* ─── Date picker — drag selection ───────────────────────────── */

function getDateFromEl(el) {
  return el && el.dataset && el.dataset.date ? el.dataset.date : null;
}

function applyDragRange(endDate) {
  if (!dragStartDate) return;
  const range = new Set(getDatesInRange(dragStartDate, endDate));
  // Remove any previously highlighted drag days that are no longer in range
  for (const s of [...pendingSelection]) {
    if (range.has(s) && dragMode === "remove") pendingSelection.delete(s);
  }
  for (const s of range) {
    if (!isPickable(s) || manualTakenDates.has(s)) continue;
    if (dragMode === "add") pendingSelection.add(s);
    else if (dragMode === "remove") pendingSelection.delete(s);
  }
}

function handleDragStart(s) {
  if (!s || !isPickable(s) || manualTakenDates.has(s)) return;
  isDragging = true;
  dragStartDate = s;
  dragMode = pendingSelection.has(s) ? "remove" : "add";
  if (dragMode === "remove") pendingSelection.delete(s);
  else pendingSelection.add(s);
  renderDP();
}

function handleDragOver(s) {
  if (!isDragging || !s) return;
  applyDragRange(s);
  renderDP(s);
}

function handleDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  dragStartDate = null;
  dragMode = null;
  renderDP();
}

// Mouse events
document.addEventListener("mouseup", handleDragEnd);

function initDPEvents() {
  const grid = document.getElementById("dpGrid");

  grid.addEventListener("mousedown", e => {
    const s = getDateFromEl(e.target);
    handleDragStart(s);
    e.preventDefault();
  });

  grid.addEventListener("mouseover", e => {
    const s = getDateFromEl(e.target);
    handleDragOver(s);
  });

  grid.addEventListener("mouseup", handleDragEnd);

  // Touch events
  grid.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    handleDragStart(getDateFromEl(el));
    e.preventDefault();
  }, { passive: false });

  grid.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    handleDragOver(getDateFromEl(el));
    e.preventDefault();
  }, { passive: false });

  grid.addEventListener("touchend", handleDragEnd);
}


/* ─── Render date picker ──────────────────────────────────────── */

function renderDP(hoverDate) {
  const allBH = getAllBHSet();
  document.getElementById("dpMonthLabel").textContent =
    MONTH_NAMES[dpMonth] + " " + dpYear;

  const grid = document.getElementById("dpGrid");
  grid.innerHTML = "";

  // Day headers
  DAY_NAMES.forEach(d => {
    const el = document.createElement("div");
    el.className = "dp-hdr";
    el.textContent = d[0];
    grid.appendChild(el);
  });

  // Leading empty cells
  const firstOfMonth = new Date(dpYear, dpMonth, 1);
  let startDow = firstOfMonth.getDay();
  if (startDow === 0) startDow = 7;
  for (let p = 1; p < startDow; p++) {
    const el = document.createElement("div");
    el.className = "dp-day dp-empty";
    grid.appendChild(el);
  }

  // Drag range highlight
  const dragRange = (isDragging && dragStartDate && hoverDate)
    ? new Set(getDatesInRange(dragStartDate, hoverDate))
    : new Set();

  const daysInMonth = new Date(dpYear, dpMonth + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(dpYear, dpMonth, day);
    const s = fmtDate(d);
    const isBH = allBH.has(s);
    const isWkend = !isWorkDay(d);
    const isTaken = manualTakenDates.has(s);
    const isSel = pendingSelection.has(s);
    const inDrag = dragRange.has(s) && isPickable(s) && !isTaken;

    const el = document.createElement("div");
    el.dataset.date = s;

    let cls = "dp-day";
    if (isBH)                          cls += " dp-bh";
    else if (isWkend)                  cls += " dp-wkend";
    else if (isTaken)                  cls += " dp-taken";
    else if (inDrag && dragMode === "add") cls += " dp-drag";
    else if (isSel)                    cls += " dp-selected";
    else                               cls += " pickable";

    el.className = cls;
    el.textContent = day;
    grid.appendChild(el);
  }

  const sc = pendingSelection.size;
  document.getElementById("selCount").textContent =
    sc === 0 ? "0 days selected" : `${sc} day${sc !== 1 ? "s" : ""} selected`;
  document.getElementById("addBtn").disabled = sc === 0;
}

function dpPrev() {
  dpMonth--;
  if (dpMonth < 0) { dpMonth = 11; dpYear--; }
  renderDP();
}

function dpNext() {
  dpMonth++;
  if (dpMonth > 11) { dpMonth = 0; dpYear++; }
  renderDP();
}


/* ─── Add / remove taken dates ────────────────────────────────── */

function addSelected() {
  for (const s of pendingSelection) manualTakenDates.add(s);
  pendingSelection.clear();
  renderDP();
  renderChips();
  rebuild();
}

function removeTakenDate(s) {
  manualTakenDates.delete(s);
  renderChips();
  renderDP();
  rebuild();
}

function renderChips() {
  const container = document.getElementById("takenChips");
  const sorted = [...manualTakenDates].sort();

  if (sorted.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:#888;margin-top:4px">No dates added yet</p>';
    return;
  }

  container.innerHTML = "";
  sorted.forEach(s => {
    const label = mkDate(s).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span>${label}</span>
      <span class="chip-x" data-date="${s}">&times;</span>`;
    container.appendChild(chip);
  });

  // Delegate removal clicks
  container.querySelectorAll(".chip-x").forEach(el => {
    el.addEventListener("click", () => removeTakenDate(el.dataset.date));
  });
}


/* ─── Stats ───────────────────────────────────────────────────── */

function getManualCountInWindow() {
  const { start, end } = getYearWindow();
  let count = 0;
  for (const s of manualTakenDates) {
    const d = mkDate(s);
    if (d >= start && d <= end && isWorkDay(d)) count++;
  }
  return count;
}

function updateYearRangeLabel() {
  const { start, end } = getYearWindow();
  const fmt = d => d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
  document.getElementById("yrRangeLabel").textContent =
    fmt(start) + " – " + fmt(end);

  const mc = getManualCountInWindow();
  document.getElementById("numTaken").value = mc;
  const total = parseInt(document.getElementById("totalLeave").value) || 25;
  document.getElementById("remainingShow").value = Math.max(0, total - mc);
}


/* ─── Cluster / suggestion engine ────────────────────────────── */

function getClusters(bankHolidays) {
  const bhSet = new Set(bankHolidays);
  const { start, end } = getYearWindow();
  const visited = new Set();
  const suggestions = [];

  for (const bh of bankHolidays) {
    const bd = mkDate(bh);

    for (let delta = -5; delta <= 5; delta++) {
      const startD = addDays(bd, delta);
      const startS = fmtDate(startD);

      if (visited.has(startS)) continue;
      if (startD < start || startD > end) continue;

      let days = [];
      let leaveCost = 0;
      let cur = new Date(startD);

      for (let k = 0; k < 18; k++) {
        if (cur > end) break;
        const cs = fmtDate(cur);
        const isBH = bhSet.has(cs);
        const isWD = isWorkDay(cur);

        if (isBH || !isWD) {
          // Free day — bank holiday or non-working day
          days.push({ date: cs, type: "free" });
        } else {
          // Working day — would cost leave
          leaveCost++;
          days.push({ date: cs, type: "leave" });
        }

        if (leaveCost > 6) break;
        cur = addDays(cur, 1);
      }

      const bhInBlock = days.filter(x => bhSet.has(x.date));
      const leaveDays = days.filter(x => x.type === "leave");

      // Only keep clusters that contain at least one BH and at least one leave day,
      // and where the total days off exceeds the leave days needed
      if (bhInBlock.length === 0 || leaveDays.length === 0) continue;
      if (days.length <= leaveDays.length) continue;

      const key = days.map(x => x.date).sort().join(",");
      if (!visited.has(key)) {
        visited.add(key);
        days.forEach(x => visited.add(x.date));
        suggestions.push({
          days,
          leaveCost: leaveDays.length,
          totalOff: days.length,
          bhDates: bhInBlock.map(x => x.date)
        });
      }
    }
  }

  // Sort by efficiency (most days off per leave day used)
  suggestions.sort((a, b) => (b.totalOff / b.leaveCost) - (a.totalOff / a.leaveCost));
  return suggestions;
}


/* ─── Main rebuild ────────────────────────────────────────────── */

function rebuild() {
  updateYearRangeLabel();

  const bankHolidays = getBankHolidaysInWindow();
  const bhSet = new Set(bankHolidays);
  const total = parseInt(document.getElementById("totalLeave").value) || 25;
  const manualCount = getManualCountInWindow();
  let remaining = total - manualCount;

  const allClusters = getClusters(bankHolidays);
  suggestedDates = new Set();
  const picked = [];
  const usedLeaveDays = new Set();

  // Greedy selection: pick clusters in efficiency order until leave runs out
  for (const c of allClusters) {
    if (remaining <= 0) break;
    const leaveDays = c.days.filter(x => x.type === "leave");
    // Skip if any leave day in this cluster is already taken or used
    if (leaveDays.some(x => manualTakenDates.has(x.date) || usedLeaveDays.has(x.date))) continue;
    if (leaveDays.length <= remaining) {
      remaining -= leaveDays.length;
      leaveDays.forEach(x => {
        suggestedDates.add(x.date);
        usedLeaveDays.add(x.date);
      });
      picked.push(c);
    }
  }

  // Sort picked clusters chronologically
  picked.sort((a, b) => a.days[0].date.localeCompare(b.days[0].date));

  const sugCount = suggestedDates.size;
  const totalUsed = manualCount + sugCount;
  let totalDaysOff = manualCount;
  for (const c of picked) totalDaysOff += c.totalOff;
  const mult = totalUsed > 0 ? (totalDaysOff / totalUsed) : 0;

  // Stats
  document.getElementById("statsRow").innerHTML = `
    <div class="stat">
      <div class="stat-n">${total - totalUsed}</div>
      <div class="stat-l">Days still available</div>
    </div>
    <div class="stat">
      <div class="stat-n blue">${sugCount}</div>
      <div class="stat-l">Suggested days off</div>
    </div>
    <div class="stat">
      <div class="stat-n green">${totalDaysOff}</div>
      <div class="stat-l">Total days off</div>
    </div>
    <div class="stat">
      <div class="stat-n green">${mult.toFixed(1)}x</div>
      <div class="stat-l">Days off per leave day</div>
    </div>
  `;

  const hasUnused = remaining <= 0 && allClusters.length > picked.length;
  document.getElementById("warnEl").className = "warn" + (hasUnused ? " on" : "");

  renderClusters(picked, bhSet);
}


/* ─── Render cluster tiles ────────────────────────────────────── */

function renderClusters(picked, bhSet) {
  const container = document.getElementById("clusters");
  container.innerHTML = "";

  if (picked.length === 0) {
    container.innerHTML =
      '<p style="color:#888;font-size:14px;padding:.5rem 0">No optimised breaks found in this holiday year. Try adjusting your settings.</p>';
    return;
  }

  picked.forEach((cluster, ci) => {
    const first = mkDate(cluster.days[0].date);
    const last  = mkDate(cluster.days[cluster.days.length - 1].date);
    const leaveDays = cluster.days.filter(x => x.type === "leave");
    const ratio = (cluster.totalOff / cluster.leaveCost).toFixed(1);
    const bhNames = cluster.bhDates.map(s => BH_NAMES[s] || s).join(", ");
    const manInCluster = leaveDays.filter(x => manualTakenDates.has(x.date)).length;

    const statusBadge = manInCluster === leaveDays.length && leaveDays.length > 0
      ? `<span class="badge badge-amber">All taken</span>`
      : manInCluster > 0
        ? `<span class="badge badge-amber">${manInCluster} taken</span>`
        : `<span class="badge badge-green">Available</span>`;

    const el = document.createElement("div");
    el.className = "cluster";
    el.innerHTML = `
      <div class="c-head">
        <div>
          <div class="c-name">
            ${first.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –
            ${last.toLocaleDateString("en-GB",  { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div class="c-desc">${bhNames}</div>
        </div>
        <div class="badges">
          <span class="badge badge-blue">${leaveDays.length} day${leaveDays.length !== 1 ? "s" : ""} leave</span>
          <span class="badge badge-purple">${cluster.totalOff} days off</span>
          <span class="badge badge-amber">${ratio}x return</span>
          ${statusBadge}
        </div>
      </div>
      <div class="c-body" id="cb${ci}">
        <p style="font-size:13px;color:#666;margin-bottom:8px">
          Use <strong style="font-weight:500">${leaveDays.length}</strong>
          leave day${leaveDays.length !== 1 ? "s" : ""} to get
          <strong style="font-weight:500">${cluster.totalOff}</strong>
          consecutive days off. Click any green day to mark it as taken.
        </p>
        ${buildMiniCal(cluster, bhSet, ci)}
      </div>
    `;

    el.querySelector(".c-head").addEventListener("click", () => {
      el.querySelector(".c-body").classList.toggle("open");
    });

    container.appendChild(el);
  });
}


/* ─── Mini calendar inside each cluster ──────────────────────── */

function buildMiniCal(cluster, bhSet, ci) {
  const first = mkDate(cluster.days[0].date);
  const last  = mkDate(cluster.days[cluster.days.length - 1].date);

  let html = "";
  let cur = new Date(first.getFullYear(), first.getMonth(), 1);
  const endM = new Date(last.getFullYear(), last.getMonth() + 1, 0);

  while (cur <= endM) {
    html += `<p class="mc-month">${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}</p>
             <div class="mc-grid">`;

    DAY_NAMES.forEach(d => { html += `<div class="mch">${d[0]}</div>`; });

    let sd = new Date(cur.getFullYear(), cur.getMonth(), 1).getDay();
    if (sd === 0) sd = 7;
    for (let p = 1; p < sd; p++) html += `<div class="mcd empty"></div>`;

    const dim = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= dim; day++) {
      const d   = new Date(cur.getFullYear(), cur.getMonth(), day);
      const s   = fmtDate(d);
      const cDay = cluster.days.find(x => x.date === s);

      let cls = "mcd";
      let title = "";
      let dateAttr = "";

      if (bhSet.has(s)) {
        cls += " bh";
        title = BH_NAMES[s] || "Bank holiday";
      } else if (manualTakenDates.has(s)) {
        cls += " manual";
        title = "Already taken — click to remove";
        dateAttr = `data-toggle="${s}" data-ci="${ci}"`;
      } else if (cDay && cDay.type === "leave") {
        cls += " sug";
        title = "Suggested leave — click to mark as taken";
        dateAttr = `data-toggle="${s}" data-ci="${ci}"`;
      } else if (!workDays.includes(dayOfWeek(d))) {
        cls += " wkend";
      }

      html += `<div class="${cls}" title="${title}" ${dateAttr}>${day}</div>`;
    }

    html += "</div>";
    cur.setMonth(cur.getMonth() + 1);
  }

  return `<div>${html}</div>`;
}

// Delegate mini-cal toggle clicks at the container level
document.getElementById("clusters").addEventListener("click", e => {
  const el = e.target;
  const s  = el.dataset.toggle;
  const ci = el.dataset.ci;
  if (!s) return;

  if (manualTakenDates.has(s)) manualTakenDates.delete(s);
  else manualTakenDates.add(s);

  renderChips();
  renderDP();
  rebuild();

  // Re-open the cluster that was clicked
  setTimeout(() => {
    const cb = document.getElementById("cb" + ci);
    if (cb) cb.classList.add("open");
  }, 10);
});


/* ─── Event listeners ─────────────────────────────────────────── */

document.getElementById("yearTypeSel").addEventListener("change", function () {
  document.getElementById("customMonthField").style.display =
    this.value === "custom" ? "block" : "none";
  rebuild();
});

document.getElementById("customMonth").addEventListener("change", rebuild);

document.getElementById("regionSel").addEventListener("change", () => {
  manualTakenDates.clear();
  pendingSelection.clear();
  renderChips();
  renderDP();
  rebuild();
});

document.getElementById("calYearSel").addEventListener("change", () => {
  manualTakenDates.clear();
  pendingSelection.clear();
  renderChips();
  renderDP();
  rebuild();
});

document.getElementById("totalLeave").addEventListener("input", rebuild);
document.getElementById("dpPrevBtn").addEventListener("click", dpPrev);
document.getElementById("dpNextBtn").addEventListener("click", dpNext);
document.getElementById("addBtn").addEventListener("click", addSelected);

