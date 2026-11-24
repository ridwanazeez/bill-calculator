<script setup>
import { computed, ref } from 'vue'
import { version } from '../package.json'
import { DENOMINATIONS, parseCount, useBillsStore } from './stores/bills'

const bills = useBillsStore()

const number = new Intl.NumberFormat('en-US')
const money = (amount) => `$${number.format(amount)}`

// Writes the cleaned value back, since Vue won't re-render when the state didn't change.
function onCount(event, denomination) {
  bills.counts[denomination] = parseCount(event.target.value)
  event.target.value = bills.counts[denomination] || ''
}

/** Engraved rosette: one line that closes after eight turns. `waves` must be odd. */
function rosette(waves) {
  const steps = 960
  const points = Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * 16 * Math.PI
    const radius = 33 + 15 * Math.sin((angle * waves) / 8)
    return `${(radius * Math.cos(angle)).toFixed(1)} ${(radius * Math.sin(angle)).toFixed(1)}`
  })
  return `M${points.join('L')}Z`
}
// A different rosette for each bill.
const rosettes = Object.fromEntries(DENOMINATIONS.map((d, i) => [d, rosette(67 - i * 8)]))

const MAX_SHEETS = 60
/** The pile, bottom sheet first: one sheet per bill, scaled down past MAX_SHEETS. */
const sheets = computed(() => {
  const scale = Math.min(1, MAX_SHEETS / bills.billCount)
  return bills.rows.flatMap(({ value, count }) =>
    Array.from({ length: count && Math.max(1, Math.round(count * scale)) }, (_, i) => ({
      key: `${value}-${i}`,
      value,
      nudge: `${((i * 37 + value) % 11) - 5}px`,
    })),
  )
})
const topBill = computed(() => sheets.value.at(-1)?.value)

function clear() {
  if (window.confirm('Clear every amount?')) bills.clear()
}

const dark = ref(document.documentElement.classList.contains('dark'))
function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  try {
    localStorage.setItem('vueuse-color-scheme', dark.value ? 'dark' : 'light')
  } catch {
    // Theme applies for this visit only.
  }
}
</script>

<template>
  <div class="page">
    <header>
      <h1>Bill calculator</h1>
      <button type="button" class="text-button" @click="toggleTheme">
        {{ dark ? 'Light mode' : 'Dark mode' }}
      </button>
    </header>

    <main>
      <table>
        <caption class="sr-only">
          Number of each bill and its total, in Guyana dollars
        </caption>
        <thead>
          <tr>
            <th scope="col">Bill</th>
            <th scope="col">Amount</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in bills.rows"
            :key="row.value"
            :class="{ filled: row.count }"
            :style="{ '--note': `var(--note-${row.value})` }"
          >
            <th scope="row">
              <span class="face">
                <span class="engraving" aria-hidden="true">
                  <svg class="rosette" viewBox="-50 -50 100 100">
                    <path :d="rosettes[row.value]" />
                  </svg>
                </span>
                <span class="value">{{ money(row.value) }}</span>
              </span>
            </th>
            <td>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="0"
                :aria-label="`Number of ${money(row.value)} bills`"
                :value="row.count || ''"
                @input="onCount($event, row.value)"
                @focus="$event.target.select()"
              />
            </td>
            <td class="row-total">{{ row.total ? money(row.total) : '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pile" aria-hidden="true">
        <svg
          class="top"
          :class="{ blank: !topBill }"
          viewBox="0 0 300 56"
          preserveAspectRatio="none"
          :style="topBill && { '--note': `var(--note-${topBill})` }"
        >
          <path class="top-paper" d="M34 1H266L299 55H1Z" />
          <path class="top-frame" d="M42 8H258L281 48H19Z" />
          <g transform="translate(150 28) scale(1 0.34)">
            <path class="top-rosette" :d="rosettes[topBill ?? DENOMINATIONS[0]]" />
          </g>
        </svg>
        <TransitionGroup tag="div" name="sheet" class="sheets">
          <i
            v-for="sheet in sheets"
            :key="sheet.key"
            :style="{ '--note': `var(--note-${sheet.value})`, '--nudge': sheet.nudge }"
          ></i>
        </TransitionGroup>
      </div>

      <section class="summary" aria-label="Summary">
        <p>
          <output data-testid="bill-count">{{ number.format(bills.billCount) }}</output>
          {{ bills.billCount === 1 ? 'bill' : 'bills' }}
        </p>
        <button type="button" class="text-button" @click="clear">Clear amounts</button>
      </section>

      <p class="grand" :style="{ '--chars': money(bills.total).length }">
        <span>Total</span>
        <output data-testid="total">{{ money(bills.total) }}</output>
      </p>
    </main>

    <footer>Version {{ version }}</footer>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  max-width: 1160px;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 0 16px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 0 8px;
}

h1 {
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0 6px;
  font-variant-numeric: tabular-nums;
}

thead th {
  padding: 4px 0;
  color: var(--ink-soft);
  font-size: 0.875rem;
  font-weight: 500;
}
thead th:first-child {
  width: 35%;
  padding-left: 12px;
  text-align: left;
}
thead th:nth-child(2) {
  width: 24%;
}
thead th:last-child {
  padding-right: 12px;
  text-align: right;
}

/* Each row is a note: pale until you have some, then it fills with its ink. */
tbody th,
tbody td {
  height: clamp(64px, 9.4dvh, 100px);
  padding: 0;
  background: color-mix(in srgb, var(--note) var(--note-tint), var(--paper));
  color: var(--ink);
  text-align: center;
  transition:
    background-color 0.25s ease-out,
    color 0.25s ease-out;
}
tbody th {
  border-radius: 8px 0 0 8px;
}
tbody td:last-child {
  border-radius: 0 8px 8px 0;
}
.filled th,
.filled td {
  background: var(--note);
  color: var(--note-ink);
}

.face {
  display: flex;
  align-items: center;
  position: relative;
  height: 100%;
  padding-left: 12px;
}
.value {
  position: relative;
  font-size: clamp(1.25rem, 5.6vw, 2.25rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}
/* Spans the row so the rosette can sit behind the amount, clipped to the note. */
.engraving {
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(100% / 0.35);
  overflow: hidden;
  border-radius: 8px;
  pointer-events: none;
}
.rosette {
  position: absolute;
  top: 50%;
  left: 47%;
  height: 200%;
  aspect-ratio: 1;
  fill: none;
  stroke: currentColor;
  stroke-width: 0.35;
  opacity: 0.3;
  transform: translate(-50%, -50%);
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.filled .rosette {
  opacity: 0.5;
  transform: translate(-50%, -50%) rotate(45deg);
}

input {
  position: relative; /* above the engraving */
  width: min(100%, 104px);
  height: 48px;
  border: 1px solid var(--field);
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink);
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  transition: border-color 0.15s ease-out;
}
input:hover {
  border-color: var(--ink);
}
input::placeholder {
  color: var(--ink-faint);
  font-weight: 400;
  opacity: 1;
}
.filled input {
  border-color: transparent;
}
.filled input:focus-visible {
  outline-color: var(--note-ink);
}

tbody .row-total {
  padding: 0 12px 0 4px;
  font-size: clamp(0.9375rem, 3.6vw, 1.25rem);
  font-weight: 600;
  text-align: right;
}

/* The pile grows a sheet per bill, coloured by the bill. */
.pile {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: min(100%, 340px);
  height: 260px;
  margin: 20px auto 0;
}
.top {
  flex: none;
  width: calc(100% - 12px);
  height: 56px;
  margin: 0 6px -1px;
  fill: none;
}
.top path {
  transition:
    fill 0.25s ease-out,
    stroke 0.25s ease-out;
}
.top-paper {
  fill: var(--note);
}
.top-frame,
.top-rosette {
  stroke: var(--note-ink);
  opacity: 0.6;
}
.top-rosette {
  stroke-width: 0.5;
}
.top.blank path {
  stroke: var(--field);
  stroke-dasharray: 4 3;
}
.blank .top-paper {
  fill: none;
}
.top.blank .top-rosette {
  stroke-dasharray: none;
}
.sheets {
  display: flex;
  flex-direction: column-reverse;
  min-height: 0;
  padding: 0 6px;
}
.sheets i {
  flex: 0 1 9px;
  min-height: 2px;
  border-radius: 1px;
  background: linear-gradient(
    color-mix(in srgb, var(--note) 45%, var(--note-ink)) 30%,
    var(--note) 30%
  );
  transform: translateX(var(--nudge));
}
.sheet-enter-active {
  transition:
    transform 0.28s cubic-bezier(0.2, 0.8, 0.3, 1),
    opacity 0.15s ease-out;
}
.sheets .sheet-enter-from {
  opacity: 0;
  transform: translate(var(--nudge), -36px);
}

.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  font-variant-numeric: tabular-nums;
}
.summary p {
  margin: 0;
}

.text-button {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.9375rem;
  text-decoration: underline;
  text-decoration-color: var(--line);
  text-underline-offset: 5px;
  cursor: pointer;
  transition:
    color 0.15s ease-out,
    text-decoration-color 0.15s ease-out;
}
.text-button:hover {
  color: var(--accent);
  text-decoration-color: currentColor;
}

/* Stays in view while counting on a phone. */
.grand {
  position: sticky;
  z-index: 1;
  bottom: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin: 8px -16px 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--ink);
  color: var(--paper);
}
.grand span {
  font-weight: 600;
}
.grand output {
  font-size: clamp(1.75rem, 8vw, 2.25rem);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

footer {
  margin-top: auto;
  padding: 16px 0 20px;
  color: var(--ink-faint);
  font-size: 0.8125rem;
}

@media (min-width: 860px) {
  .page {
    padding: 0 32px;
  }
  header {
    padding: 32px 0 20px;
  }
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
    grid-template-rows: auto minmax(0, 1fr) auto;
    column-gap: 56px;
  }
  table {
    grid-row: 1 / 4;
  }
  thead th:first-child,
  .face {
    padding-left: 24px;
  }
  thead th:last-child,
  tbody .row-total {
    padding-right: 24px;
  }
  .rosette {
    height: 270%;
  }
  .grand,
  .pile,
  .summary {
    grid-column: 2;
  }
  .grand {
    position: static;
    display: block;
    grid-row: 1;
    margin: 0;
    padding: 6px 0 0;
    background: none;
    color: inherit;
    container-type: inline-size;
  }
  .grand output {
    display: block;
    /* Shrinks so the longest total still fits on one line. */
    font-size: min(5rem, calc(100cqi / (var(--chars) * 0.58)));
    line-height: 1.1;
  }
  .pile {
    grid-row: 2;
    /* Fills the column without stretching the rows. */
    contain: size;
    width: 100%;
    height: auto;
    min-height: 200px;
    border-bottom: 3px solid var(--ink);
  }
  .summary {
    grid-row: 3;
    padding: 8px 0 0;
  }
}
</style>
