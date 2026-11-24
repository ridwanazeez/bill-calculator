import { computed, reactive, watch } from 'vue'
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

  const rows = computed(() =>
    DENOMINATIONS.map((value) => ({ value, count: counts[value], total: value * counts[value] })),
  )
  const total = computed(() => rows.value.reduce((sum, row) => sum + row.total, 0))
  const billCount = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0))

  function clear() {
    for (const d of DENOMINATIONS) counts[d] = 0
  }

  watch(counts, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts }))
    } catch {
      // Storage is blocked or full: the calculator still works, it just won't be remembered.
    }
  })

  return { counts, rows, total, billCount, clear }
})
