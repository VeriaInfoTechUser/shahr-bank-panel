<template>
  <div class="dp-root" :dir="cal === 'fa' ? 'rtl' : 'ltr'">

    <!-- ── Calendar Toggle ───────────────────────────── -->
    <div class="dp-cal-toggle">
      <button class="dp-cal-btn" :class="{ active: cal === 'fa' }" @click="switchCalendar('fa')">شمسی</button>
      <button class="dp-cal-btn" :class="{ active: cal === 'en' }" @click="switchCalendar('en')">میلادی</button>
    </div>

    <!-- ── Mode Tabs ─────────────────────────────────── -->
    <div class="dp-modes">
      <button
          v-for="m in filteredModes" :key="m.value"
          class="dp-mode-btn" :class="{ active: mode === m.value }"
          @click="mode = m.value"
      >{{ m.label }}</button>
    </div>

    <!-- ── Navigation ────────────────────────────────── -->
    <!--
      FIX: previously this used `navigate(cal === 'fa' ? 1 : -1)` etc.
      Setting dir="rtl" on a flex row already reverses the *visual* order of
      the two buttons by itself, so flipping the dir value on top of that
      caused the chevrons to move the wrong direction in Shamsi mode.
      Keeping the values fixed (-1 for the first button, +1 for the second)
      lets the browser's own RTL reordering do the right thing.
    -->
    <div class="dp-nav">
      <button class="dp-nav-btn" @click="navigate(-1)">&#8249;</button>
      <span class="dp-nav-title">{{ navTitle }}</span>
      <button class="dp-nav-btn" @click="navigate(1)">&#8250;</button>
    </div>

    <!-- ── Body ──────────────────────────────────────── -->
    <div class="dp-body">

      <!-- Day / Week grid -->
      <template v-if="mode === 'day' || mode === 'week'">
        <div class="dp-grid-7 dp-weekdays-row">
          <div v-for="w in weekdays" :key="w" class="dp-weekday">{{ w }}</div>
        </div>
        <div class="dp-grid-7">
          <div
              v-for="(cell, i) in calendarDays" :key="i"
              class="dp-day"
              :class="{
                'dp-day--other':      cell.other,
                'dp-day--today':      cell.isToday && !cell.isSelected && !cell.isWeekStart,
                'dp-day--selected':   cell.isSelected,
                'dp-day--week-range': cell.inWeek,
                'dp-day--week-start': cell.isWeekStart,
              }"
              @click="!cell.other && handleDayClick(cell)"
          >
            <span v-if="!cell.other">{{ cell.label }}</span>
          </div>
        </div>
        <p v-if="mode === 'week'" class="dp-hint">
          {{ cal === 'fa' ? 'روز شروع هفته را انتخاب کنید؛ پایان هفته (۷ روزه) خودکار محاسبه می‌شود.' : 'Pick the week\'s start day — the end date (7-day week) is calculated automatically.' }}
        </p>
      </template>

      <!-- Month grid -->
      <template v-if="mode === 'month'">
        <div class="dp-grid-3">
          <div
              v-for="(name, i) in monthNames" :key="i"
              class="dp-cell" :class="{ 'dp-cell--selected': isMonthSelected(i + 1) }"
              @click="handleMonthClick(i + 1)"
          >{{ name }}</div>
        </div>
      </template>

      <!-- Season / Quarter grid -->
      <template v-if="mode === 'season'">
        <div class="dp-grid-2">
          <div
              v-for="(s, i) in seasons" :key="s.name"
              class="dp-cell dp-season-cell" :class="{ 'dp-cell--selected': isSeasonSelected(i + 1) }"
              @click="handleSeasonClick(i + 1)"
          >
            <div class="dp-season-icon">{{ s.icon }}</div>
            <div class="dp-season-name">{{ s.name }}</div>
            <div class="dp-season-sub">{{ s.sub }}</div>
          </div>
        </div>
      </template>

      <!-- Year grid -->
      <template v-if="mode === 'year'">
        <div class="dp-grid-3">
          <div
              v-for="y in yearRange" :key="y"
              class="dp-cell" :class="{ 'dp-cell--selected': isYearSelected(y) }"
              @click="handleYearClick(y)"
          >{{ formatYear(y) }}</div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
/**
 * DatePicker.vue
 * Bilingual (Shamsi / Gregorian) date picker. Always emits Gregorian output.
 *
 * Props:
 *   modelValue  — current value (output object | null)
 *
 * Emits:
 *   update:modelValue — fires immediately on every selection, and with `null`
 *                       whenever the active calendar or mode changes (so the
 *                       parent's bound value never goes stale vs. the UI).
 *
 * Output shape — uniform across every mode, always Gregorian ISO dates:
 *   { type: PeriodType, startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 *
 *   DAILY     → startDate === endDate (the selected day)
 *   WEEKLY    → startDate = selected day, endDate = startDate + 6 days
 *   MONTHLY   → full selected month
 *   QUARTERLY → full selected season / quarter
 *   YEARLY    → full selected year
 *
 * Usage:
 *   <DatePicker v-model="form.period" />
 */

import { ref, computed, watch, nextTick } from 'vue'

// ── PeriodType ───────────────────────────────────────────────────────────────
// If your project already has the real TS enum, import it instead of this
// local mirror, e.g.:
//   import { PeriodType } from '@/common/enums/period-type.enum'
const PeriodType = {
  DAILY:     'DAILY',
  WEEKLY:    'WEEKLY',
  MONTHLY:   'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY:    'YEARLY',
}

// ── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Object, default: null },
  /** Allowed mode values. Defaults to all modes. E.g. ['month', 'year'] */
  modes: { type: Array, default: () => ['day', 'week', 'month', 'season', 'year'] },
})
const emit  = defineEmits(['update:modelValue', 'calendarChange'])

// ── Constants ────────────────────────────────────────────────────────────────
const MODES = [
  { value: 'day',    label: 'روز / Day'   },
  { value: 'week',   label: 'هفته / Week' },
  { value: 'month',  label: 'ماه / Month' },
  { value: 'season', label: 'فصل / Q'    },
  { value: 'year',   label: 'سال / Year'  },
]

const FA_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const FA_SEASONS = [
  { name:'بهار',    icon:' ', sub:'فروردین – خرداد',  m:[1,2,3]   },
  { name:'تابستان', icon:'  ', sub:'تیر – شهریور',     m:[4,5,6]   },
  { name:'پاییز',   icon:' ', sub:'مهر – آذر',         m:[7,8,9]   },
  { name:'زمستان',  icon:'  ', sub:'دی – اسفند',        m:[10,11,12]},
]
const EN_SEASONS = [
  { name:'Q1', icon:'❶', sub:'Jan – Mar', m:[1,2,3]   },
  { name:'Q2', icon:'❷', sub:'Apr – Jun', m:[4,5,6]   },
  { name:'Q3', icon:'❸', sub:'Jul – Sep', m:[7,8,9]   },
  { name:'Q4', icon:'❹', sub:'Oct – Dec', m:[10,11,12]},
]

// Sat=0 … Fri=6  (Jalali week starts Saturday)
const FA_WD = ['ش','ی','د','س','چ','پ','ج']
// Sun=0 … Sat=6  (Gregorian week starts Sunday)
const EN_WD = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Jalali helpers — Borkowski algorithm (exact port of jalaali-js) ──────────
const BREAKS = [-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178]
function _div(a,b){ return ~~(a/b) }
function _mod(a,b){ return a - ~~(a/b)*b }

function _jalCalCore(jy) {
  const gy = jy + 621
  let leapJ = -14, jp = BREAKS[0], jm = 0, jump = 0
  for (let i = 1; i < BREAKS.length; i++) {
    jm = BREAKS[i]; jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + _div(jump,33)*8 + _div(_mod(jump,33),4)
    jp = jm
  }
  const n = jy - jp
  leapJ = leapJ + _div(n,33)*8 + _div(_mod(n,33)+3,4)
  if (_mod(jump,33) === 4 && jump - n === 4) leapJ += 1
  const leapG = _div(gy,4) - _div((_div(gy,100)+1)*3,4) - 150
  const march = 20 + leapJ - leapG
  return { gy, march, jump, n }
}
function _leapFromCycle(jump, n) {
  let a = n
  if (jump - n < 6) a = n - jump + _div(jump+4,33)*33
  let leap = _mod(_mod(a+1,33)-1, 4)
  if (leap === -1) leap = 4
  return leap
}
function _jalCal(jy)      { const r = _jalCalCore(jy); return { leap: _leapFromCycle(r.jump, r.n), gy: r.gy, march: r.march } }
function _jalCalShort(jy) { const { gy, march } = _jalCalCore(jy); return { gy, march } }

function isLeapJalali(jy) {
  let jp = BREAKS[0], jm = 0, jump = 0
  for (let i = 1; i < BREAKS.length; i++) { jm = BREAKS[i]; jump = jm - jp; if (jy < jm) break; jp = jm }
  return _leapFromCycle(jump, jy - jp) === 0
}

function g2d(gy, gm, gd) {
  let d = _div((gy + _div(gm-8,6) + 100100)*1461,4) + _div(153*_mod(gm+9,12)+2,5) + gd - 34840408
  d = d - _div(_div(gy+100100+_div(gm-8,6),100)*3,4) + 752
  return d
}
function d2g(jdn) {
  let j = 4*jdn + 139361631
  j = j + _div(_div(4*jdn+183187720,146097)*3,4)*4 - 3908
  const i  = _div(_mod(j,1461),4)*5 + 308
  const gd = _div(_mod(i,153),5) + 1
  const gm = _mod(_div(i,153),12) + 1
  const gy = _div(j,1461) - 100100 + _div(8-gm,6)
  return { gy, gm, gd }
}
function j2d(jy, jm, jd) {
  const r = _jalCalShort(jy)
  return g2d(r.gy, 3, r.march) + (jm-1)*31 - _div(jm,7)*(jm-7) + jd - 1
}
function d2j(jdn) {
  const gy = d2g(jdn).gy
  let jy   = gy - 621
  const r  = _jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + _div(k,31), jd: _mod(k,31) + 1 }
    k -= 186
  } else {
    jy -= 1
    k  += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + _div(k,30), jd: _mod(k,30) + 1 }
}

function toJalali(gy, gm, gd)   { return d2j(g2d(gy, gm, gd)) }
function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)) }

function jDaysInMonth(jy, jm) {
  if (jm <= 6)  return 31
  if (jm <= 11) return 30
  return isLeapJalali(jy) ? 30 : 29
}
function isLeapGregorian(gy) { return gy%4 === 0 && (gy%100 !== 0 || gy%400 === 0) }
function gDaysInMonth(gy, gm) {
  return [0,31,isLeapGregorian(gy)?29:28,31,30,31,30,31,31,30,31,30,31][gm]
}

/** 0=Saturday … 6=Friday  (Jalali week) */
function jDayOfWeek(jy, jm, jd) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return (new Date(gy, gm-1, gd).getDay() + 1) % 7
}
/** 0=Sunday … 6=Saturday  (Gregorian week) */
function gDayOfWeek(gy, gm, gd) {
  return new Date(gy, gm-1, gd).getDay()
}

function toFa(n)      { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) }
function pad(n)       { return String(n).padStart(2, '0') }
function isoDate(y,m,d) { return `${y}-${pad(m)}-${pad(d)}` }

// ── Today ────────────────────────────────────────────────────────────────────
const _now   = new Date()
const todayG = { gy: _now.getFullYear(), gm: _now.getMonth()+1, gd: _now.getDate() }
const todayJ = toJalali(todayG.gy, todayG.gm, todayG.gd)

// ── State ────────────────────────────────────────────────────────────────────
const cal       = ref('fa')          // 'fa' | 'en'
const mode      = ref(props.modes[0] ?? 'day')
const viewYear  = ref(todayJ.jy)     // stored in active calendar's unit
const viewMonth = ref(todayJ.jm)
const selRaw    = ref(null)          // internal selection (active-cal coords)

// ── ModelValue sync ──────────────────────────────────────────────────────────
// When the parent sets `modelValue` programmatically (e.g. adopting the
// backend-resolved default period) the internal view/selection must follow,
// otherwise the picker renders today's year with nothing selected.
const syncing = ref(false)

function parseIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''))
  if (!m) return null
  return { y: +m[1], m: +m[2], d: +m[3] }
}

function typeToMode(type) {
  const t = String(type || '').toUpperCase()
  if (t === 'YEARLY')    return 'year'
  if (t === 'QUARTERLY') return 'season'
  if (t === 'MONTHLY')   return 'month'
  if (t === 'WEEKLY')    return 'week'
  return 'day'
}

watch(() => props.modelValue, (val) => {
  if (!val || typeof val.type !== 'string') return
  const iso = parseIso(val.startDate)
  if (!iso) return

  const targetMode = typeToMode(val.type)
  if (!props.modes.includes(targetMode)) return

  syncing.value = true
  try {
    mode.value = targetMode
    if (cal.value === 'fa') {
      const j = toJalali(iso.y, iso.m, iso.d)
      viewYear.value  = j.jy
      viewMonth.value = j.jm
      if (targetMode === 'day' || targetMode === 'week') selRaw.value = { type: targetMode, y: j.jy, m: j.jm, d: j.jd }
      else if (targetMode === 'month') selRaw.value = { type: 'month', y: j.jy, m: j.jm }
      else if (targetMode === 'season') selRaw.value = { type: 'season', y: j.jy, s: Math.floor((j.jm - 1) / 3) + 1 }
      else selRaw.value = { type: 'year', y: j.jy }
    } else {
      viewYear.value  = iso.y
      viewMonth.value = iso.m
      if (targetMode === 'day' || targetMode === 'week') selRaw.value = { type: targetMode, y: iso.y, m: iso.m, d: iso.d }
      else if (targetMode === 'month') selRaw.value = { type: 'month', y: iso.y, m: iso.m }
      else if (targetMode === 'season') selRaw.value = { type: 'season', y: iso.y, s: Math.floor((iso.m - 1) / 3) + 1 }
      else selRaw.value = { type: 'year', y: iso.y }
    }
  } finally {
    // keep the guard active until the pre-flush `watch(mode)` callback has
    // run, otherwise it would clear the selection we just synced in.
    void nextTick(() => { syncing.value = false })
  }
}, { immediate: true })

// ── Filtered modes ──────────────────────────────────────────────────────────
const filteredModes = computed(() =>
  MODES.filter(m => props.modes.includes(m.value))
)

// Reset mode when allowed modes change and current mode is no longer valid
watch(() => props.modes, (newModes) => {
  if (!newModes.includes(mode.value)) {
    mode.value = newModes[0] ?? 'day'
  }
})

// FIX: clearing the selection on mode change wasn't reflected to the parent.
// Now we also emit `null` so v-model never goes stale vs. the (now-empty) UI.
watch(mode, () => {
  if (syncing.value) return
  selRaw.value = null
  emit('update:modelValue', null)
})

// ── Calendar switch ───────────────────────────────────────────────────────────
function switchCalendar(c) {
  if (c === cal.value) return
  if (c === 'en') {
    const g = toGregorian(viewYear.value, viewMonth.value, 1)
    viewYear.value  = g.gy
    viewMonth.value = g.gm
  } else {
    const j = toJalali(viewYear.value, viewMonth.value, 1)
    viewYear.value  = j.jy
    viewMonth.value = j.jm
  }
  cal.value    = c
  emit('calendarChange', c === 'fa' ? 'jalali' : 'gregorian')
  selRaw.value = null
  emit('update:modelValue', null)
}

// ── Derived ───────────────────────────────────────────────────────────────────
const weekdays   = computed(() => cal.value === 'fa' ? FA_WD : EN_WD)
const monthNames = computed(() => cal.value === 'fa' ? FA_MONTHS : EN_MONTHS)
const seasons    = computed(() => cal.value === 'fa' ? FA_SEASONS : EN_SEASONS)

const navTitle = computed(() => {
  const y    = viewYear.value
  const m    = viewMonth.value
  const isFa = cal.value === 'fa'
  if (mode.value === 'day' || mode.value === 'week')
    return isFa ? `${FA_MONTHS[m-1]} ${toFa(y)}` : `${EN_MONTHS[m-1]} ${y}`
  if (mode.value === 'month' || mode.value === 'season')
    return isFa ? toFa(y) : String(y)
  const base = y - 4
  return isFa ? `${toFa(base)} – ${toFa(base+11)}` : `${base} – ${base+11}`
})

function formatYear(y) { return cal.value === 'fa' ? toFa(y) : String(y) }

// ── Week range (for highlighting the 7-day band in 'week' mode) ─────────────
const weekRange = computed(() => {
  if (selRaw.value?.type !== 'week') return null
  const isFa = cal.value === 'fa'
  const startJdn = isFa
      ? j2d(selRaw.value.y, selRaw.value.m, selRaw.value.d)
      : g2d(selRaw.value.y, selRaw.value.m, selRaw.value.d)
  return { startJdn, endJdn: startJdn + 6 }
})

// ── Calendar day cells ────────────────────────────────────────────────────────
const calendarDays = computed(() => {
  if (mode.value !== 'day' && mode.value !== 'week') return []
  const isFa = cal.value === 'fa'
  const y = viewYear.value
  const m = viewMonth.value

  const cells = []

  if (isFa) {
    const firstDow = jDayOfWeek(y, m, 1)
    const dim      = jDaysInMonth(y, m)
    const pM       = m === 1 ? 12 : m - 1
    const pY       = m === 1 ? y - 1 : y
    const pDim     = jDaysInMonth(pY, pM)
    for (let i = firstDow - 1; i >= 0; i--)
      cells.push({ other:true, label:toFa(pDim-i) })
    for (let d = 1; d <= dim; d++) {
      const jdn         = j2d(y, m, d)
      const isToday     = y === todayJ.jy && m === todayJ.jm && d === todayJ.jd
      const isSelected  = selRaw.value?.type === 'day' && selRaw.value.y === y && selRaw.value.m === m && selRaw.value.d === d
      const inWeek      = !!weekRange.value && jdn >= weekRange.value.startJdn && jdn <= weekRange.value.endJdn
      const isWeekStart = !!weekRange.value && jdn === weekRange.value.startJdn
      cells.push({ other:false, label:toFa(d), isToday, isSelected, inWeek, isWeekStart, jy:y, jm:m, jd:d })
    }
    const nM = m === 12 ? 1 : m + 1; const nY = m === 12 ? y + 1 : y; let nd = 1
    while (cells.length % 7 !== 0) cells.push({ other:true, label:toFa(nd++) })
  } else {
    const firstDow = gDayOfWeek(y, m, 1)
    const dim      = gDaysInMonth(y, m)
    const pM       = m === 1 ? 12 : m - 1
    const pY       = m === 1 ? y - 1 : y
    const pDim     = gDaysInMonth(pY, pM)
    for (let i = firstDow - 1; i >= 0; i--)
      cells.push({ other:true, label:String(pDim-i) })
    for (let d = 1; d <= dim; d++) {
      const jdn         = g2d(y, m, d)
      const isToday     = y === todayG.gy && m === todayG.gm && d === todayG.gd
      const isSelected  = selRaw.value?.type === 'day' && selRaw.value.y === y && selRaw.value.m === m && selRaw.value.d === d
      const inWeek      = !!weekRange.value && jdn >= weekRange.value.startJdn && jdn <= weekRange.value.endJdn
      const isWeekStart = !!weekRange.value && jdn === weekRange.value.startJdn
      cells.push({ other:false, label:String(d), isToday, isSelected, inWeek, isWeekStart, gy:y, gm:m, gd:d })
    }
    let nd = 1
    while (cells.length % 7 !== 0) cells.push({ other:true, label:String(nd++) })
  }

  return cells
})

const yearRange = computed(() =>
    Array.from({ length:12 }, (_,i) => viewYear.value - 4 + i)
)

// ── isSelected helpers ────────────────────────────────────────────────────────
function isMonthSelected(m) {
  return selRaw.value?.type === 'month' && selRaw.value.m === m && selRaw.value.y === viewYear.value
}
function isSeasonSelected(s) {
  return selRaw.value?.type === 'season' && selRaw.value.s === s && selRaw.value.y === viewYear.value
}
function isYearSelected(y) {
  return selRaw.value?.type === 'year' && selRaw.value.y === y
}

// ── Navigation ────────────────────────────────────────────────────────────────
// FIX: no longer flips direction based on `cal`. Setting dir="rtl" on the
// flex row already reverses the *visual* button order on its own; flipping
// the values too caused the chevrons to move the wrong way in Shamsi mode.
function navigate(dir) {
  if (mode.value === 'day' || mode.value === 'week') {
    viewMonth.value += dir
    if (viewMonth.value > 12) { viewMonth.value = 1;  viewYear.value++ }
    if (viewMonth.value < 1)  { viewMonth.value = 12; viewYear.value-- }
  } else if (mode.value === 'month' || mode.value === 'season') {
    viewYear.value += dir
  } else {
    viewYear.value += dir * 12
  }
}

// ── Gregorian range builders ──────────────────────────────────────────────────
function jMonthRange(jy, jm) {
  const dim  = jDaysInMonth(jy, jm)
  const s    = toGregorian(jy, jm, 1)
  const e    = toGregorian(jy, jm, dim)
  return { startDate: isoDate(s.gy,s.gm,s.gd), endDate: isoDate(e.gy,e.gm,e.gd) }
}
function jSeasonRange(jy, season) {
  const fm  = (season-1)*3 + 1
  const lm  = season*3
  const dim = jDaysInMonth(jy, lm)
  const s   = toGregorian(jy, fm, 1)
  const e   = toGregorian(jy, lm, dim)
  return { startDate: isoDate(s.gy,s.gm,s.gd), endDate: isoDate(e.gy,e.gm,e.gd) }
}
function jYearRange(jy) {
  const s = toGregorian(jy, 1, 1)
  const e = toGregorian(jy, 12, isLeapJalali(jy) ? 30 : 29)
  return { startDate: isoDate(s.gy,s.gm,s.gd), endDate: isoDate(e.gy,e.gm,e.gd) }
}
function gMonthRange(gy, gm) {
  return { startDate: isoDate(gy,gm,1), endDate: isoDate(gy,gm,gDaysInMonth(gy,gm)) }
}
function gQuarterRange(gy, q) {
  const fm = (q-1)*3+1, lm = q*3
  return { startDate: isoDate(gy,fm,1), endDate: isoDate(gy,lm,gDaysInMonth(gy,lm)) }
}
function gYearRange(gy) {
  return { startDate: isoDate(gy,1,1), endDate: isoDate(gy,12,31) }
}

// ── Handlers ─────────────────────────────────────────────────────────────────
function emitPeriod(type, startDate, endDate) {
  emit('update:modelValue', { type, startDate, endDate })
}

function handleDayClick(cell) {
  const isFa = cal.value === 'fa'

  if (mode.value === 'week') {
    selRaw.value = isFa
        ? { type:'week', y:cell.jy, m:cell.jm, d:cell.jd }
        : { type:'week', y:cell.gy, m:cell.gm, d:cell.gd }

    // Week start → Julian Day Number → +6 days → Gregorian. This works
    // correctly across month/year boundaries regardless of which calendar
    // the start day was picked in.
    const startJdn = isFa ? j2d(cell.jy, cell.jm, cell.jd) : g2d(cell.gy, cell.gm, cell.gd)
    const s = d2g(startJdn)
    const e = d2g(startJdn + 6)
    emitPeriod(PeriodType.WEEKLY, isoDate(s.gy,s.gm,s.gd), isoDate(e.gy,e.gm,e.gd))
    return
  }

  // mode === 'day'
  let g
  if (isFa) {
    selRaw.value = { type:'day', y:cell.jy, m:cell.jm, d:cell.jd }
    g = toGregorian(cell.jy, cell.jm, cell.jd)
  } else {
    selRaw.value = { type:'day', y:cell.gy, m:cell.gm, d:cell.gd }
    g = { gy:cell.gy, gm:cell.gm, gd:cell.gd }
  }
  const iso = isoDate(g.gy, g.gm, g.gd)
  emitPeriod(PeriodType.DAILY, iso, iso)
}

function handleMonthClick(m) {
  selRaw.value = { type:'month', y:viewYear.value, m }
  const r = cal.value === 'fa' ? jMonthRange(viewYear.value, m) : gMonthRange(viewYear.value, m)
  emitPeriod(PeriodType.MONTHLY, r.startDate, r.endDate)
}

function handleSeasonClick(s) {
  selRaw.value = { type:'season', y:viewYear.value, s }
  const r = cal.value === 'fa' ? jSeasonRange(viewYear.value, s) : gQuarterRange(viewYear.value, s)
  emitPeriod(PeriodType.QUARTERLY, r.startDate, r.endDate)
}

function handleYearClick(y) {
  selRaw.value = { type:'year', y }
  const r = cal.value === 'fa' ? jYearRange(y) : gYearRange(y)
  emitPeriod(PeriodType.YEARLY, r.startDate, r.endDate)
}
</script>

<style scoped>
.dp-root {
  font-family: Vazirmatn, 'Vazir', Tahoma, sans-serif;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  width: 320px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  user-select: none;
}

/* ── Calendar toggle ── */
.dp-cal-toggle {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.dp-cal-btn {
  flex: 1;
  padding: 8px 0;
  font-size: 13px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.dp-cal-btn:hover { color: #1e293b; }
.dp-cal-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: #fff;
}

/* ── Mode tabs ── */
.dp-modes {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.dp-mode-btn {
  flex: 1;
  padding: 5px 2px;
  font-size: 11px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  line-height: 1.3;
  min-width: 56px;
}
.dp-mode-btn:hover { background: #f1f5f9; color: #1e293b; }
.dp-mode-btn.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
  font-weight: 600;
}

/* ── Nav ── */
.dp-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.dp-nav-btn {
  width: 28px; height: 28px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #64748b;
  transition: all 0.12s; line-height: 1;
}
.dp-nav-btn:hover { background: #f8fafc; color: #1e293b; border-color: #94a3b8; }
.dp-nav-title { font-size: 14px; font-weight: 600; color: #1e293b; }

/* ── Body ── */
.dp-body { padding: 10px 12px; }

/* ── Day grid ── */
.dp-grid-7 { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.dp-weekdays-row { margin-bottom: 4px; }
.dp-weekday { text-align: center; font-size: 10px; color: #94a3b8; padding: 2px 0 6px; }

.dp-day {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #1e293b;
  border-radius: 6px; cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.1s;
}
.dp-day:hover:not(.dp-day--other) { background: #f1f5f9; }
.dp-day--other { color: transparent; cursor: default; pointer-events: none; }
.dp-day--today { border-color: #93c5fd; color: #2563eb; font-weight: 600; }
.dp-day--selected { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 600; }

/* week-mode highlight */
.dp-day--week-range { background: #dbeafe; color: #1e3a8a; border-radius: 4px; }
.dp-day--week-start { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 600; }

.dp-hint {
  margin: 8px 2px 0;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.5;
}

/* ── Month / Season / Year ── */
.dp-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
.dp-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }

.dp-cell {
  padding: 8px 4px;
  text-align: center;
  font-size: 13px; color: #1e293b;
  border-radius: 8px; cursor: pointer;
  border: 1px solid #e2e8f0; background: #fff;
  transition: all 0.12s; line-height: 1.4;
}
.dp-cell:hover:not(.dp-cell--selected) { background: #f8fafc; border-color: #94a3b8; }
.dp-cell--selected { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 600; }

.dp-season-cell { padding: 10px 6px; }
.dp-season-icon { font-size: 18px; margin-bottom: 3px; }
.dp-season-name { font-size: 13px; font-weight: 600; }
.dp-season-sub  { font-size: 10px; color: #94a3b8; margin-top: 2px; }
.dp-cell--selected .dp-season-sub { color: rgba(255,255,255,0.65); }
</style>