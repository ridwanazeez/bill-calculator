import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const DENOMINATIONS = [5000, 2000, 1000, 500, 100, 50, 20]
export const STORAGE_KEY = 'bill-calculator'

/** Whole, non-negative count from anything typed or stored. Capped at five digits. */
export function parseCount(value) {
  return Number(
    String(value ?? '')
      .split('.')[0]
      .replace(/\D/g, '')
      .slice(0, 5),
  )
}

/** Keeps a money field typeable ("12." is valid mid-entry): digits, one point, two decimals. */
export function cleanMoney(value) {
  const [whole, ...rest] = String(value ?? '')
    .replace(/[^\d.]/g, '')
    .split('.')
  const digits = whole.slice(0, 9)
  return rest.length ? `${digits}.${rest.join('').slice(0, 2)}` : digits
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export const useBillsStore = defineStore('bills', () => {
  const saved = load()
  const counts = reactive(
    Object.fromEntries(DENOMINATIONS.map((d) => [d, parseCount(saved.counts?.[d])])),
  )
  const other = ref(cleanMoney(saved.other))

  const rows = computed(() =>
    DENOMINATIONS.map((value) => ({ value, count: counts[value], total: value * counts[value] })),
  )
  const billsTotal = computed(() => rows.value.reduce((sum, row) => sum + row.total, 0))
  // "." alone is not a number yet
  const grandTotal = computed(() => billsTotal.value + (Number(other.value) || 0))

  function clear() {
    for (const d of DENOMINATIONS) counts[d] = 0
    other.value = ''
  }

  watch([counts, other], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts, other: other.value }))
    } catch {
      // Storage is blocked or full: the calculator still works, it just won't be remembered.
    }
  })

  return { counts, other, rows, billsTotal, grandTotal, clear }
})
