<script setup>
import { ref } from 'vue'
import { cleanMoney, parseCount, useBillsStore } from './stores/bills'

const bills = useBillsStore()

const number = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
})
const money = (amount) => `$${number.format(amount)}`

// Writes the cleaned value back, since Vue won't re-render when the state didn't change.
function onCount(event, denomination) {
  bills.counts[denomination] = parseCount(event.target.value)
  event.target.value = bills.counts[denomination] || ''
}
function onOther(event) {
  bills.other = cleanMoney(event.target.value)
  event.target.value = bills.other
}

/** One offset edge per bill, up to five, so the note looks like a pile. */
function pile(count) {
  const edges = Math.max(0, Math.min(count, 5) - 1)
  return Array.from({ length: edges }, (_, i) => {
    const y = (i + 1) * 3
    return `0 ${y - 1}px 0 var(--paper), 0 ${y}px 0 var(--note)`
  }).join(', ')
}

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
            <th scope="col" class="center">Amount</th>
            <th scope="col" class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in bills.rows" :key="row.value" :class="{ empty: !row.count }">
            <th scope="row">
              <span
                class="note"
                :style="{ '--note': `var(--note-${row.value})`, boxShadow: pile(row.count) }"
                >{{ money(row.value) }}</span
              >
            </th>
            <td class="center">
              <input
                class="count"
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
            <td class="right figure">{{ row.total ? money(row.total) : '-' }}</td>
          </tr>
        </tbody>
      </table>

      <section class="summary" aria-label="Totals">
        <p class="line">
          <span>Bills total</span>
          <output class="figure" data-testid="bills-total">{{ money(bills.billsTotal) }}</output>
        </p>
        <p class="line">
          <label for="other">Other money</label>
          <span class="other">
            <span aria-hidden="true">$</span>
            <input
              id="other"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0"
              :value="bills.other"
              @input="onOther"
              @focus="$event.target.select()"
            />
          </span>
        </p>
        <button type="button" class="text-button" @click="clear">Clear amounts</button>
      </section>

      <p class="grand">
        <span>Grand total</span>
        <output data-testid="grand-total">{{ money(bills.grandTotal) }}</output>
      </p>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 0 20px;
}

h1 {
  margin: 0;
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  padding: 8px 0;
  border-bottom: 2px solid var(--line-strong);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
}

tbody th,
tbody td {
  height: 68px;
  padding: 0;
  border-bottom: 1px solid var(--line);
  font-weight: 400;
  text-align: left;
}

/* Two-class selectors so these beat the table cell defaults above. */
table .center {
  text-align: center;
}
table .right {
  text-align: right;
}

.figure {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
}

.empty .figure {
  color: var(--ink-faint);
}

.note {
  display: inline-grid;
  place-items: center;
  width: 76px;
  height: 36px;
  border: 1px solid var(--note);
  border-radius: 3px;
  background: color-mix(in srgb, var(--note) 22%, var(--paper));
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9375rem;
  transition: box-shadow 0.2s ease-out;
}

.empty .note {
  background: transparent;
}

input {
  height: 44px;
  border: 1px solid var(--field);
  border-radius: 3px;
  background: var(--paper-raised);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 1.0625rem;
  transition: border-color 0.15s ease-out;
}
input:hover {
  border-color: var(--ink);
}
input::placeholder {
  color: var(--ink-faint);
  opacity: 1;
}

.count {
  width: 88px;
  text-align: center;
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 60px;
  margin: 0;
  border-bottom: 1px solid var(--line);
}

.other {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
}
.other input {
  width: 160px;
  padding: 0 12px;
  text-align: right;
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
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 16px;
  margin: 12px -20px 0;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  background: var(--accent);
  color: var(--accent-ink);
}
.grand span {
  font-weight: 600;
}
.grand output {
  font-size: clamp(1.75rem, 8vw, 2.25rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

@media (min-width: 860px) {
  header {
    padding: 48px 0 32px;
  }
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    grid-template-rows: auto 1fr;
    column-gap: 72px;
    padding-bottom: 64px;
  }
  table {
    grid-row: 1 / 3;
  }
  .grand {
    position: static;
    grid-column: 2;
    grid-row: 1;
    flex-direction: column;
    margin: 0 0 8px;
    padding: 24px;
    border-radius: 3px;
  }
  .grand output {
    font-size: 2.5rem;
    overflow-wrap: anywhere;
  }
  .summary {
    grid-column: 2;
    grid-row: 2;
  }
}
</style>
