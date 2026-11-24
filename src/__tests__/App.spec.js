import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import App from '../App.vue'
import { cleanMoney, parseCount, STORAGE_KEY } from '../stores/bills'

const open = () => mount(App, { global: { plugins: [createPinia()] } })
const field = (w, bill) => w.get(`[aria-label="Number of ${bill} bills"]`)
const total = (w, name) => w.get(`[data-testid="${name}-total"]`).text()

beforeEach(() => localStorage.clear())

describe('bill calculator', () => {
  it('matches the spreadsheet and updates on input alone', async () => {
    const w = open()
    await field(w, '$500').setValue('3')
    expect(total(w, 'bills')).toBe('$1,500')
    await field(w, '$100').setValue('29')
    await field(w, '$20').setValue('8')
    expect(total(w, 'bills')).toBe('$4,560')
    await w.get('#other').setValue('62,260')
    expect(total(w, 'grand')).toBe('$66,820')
    await field(w, '$500').setValue('')
    expect(total(w, 'grand')).toBe('$65,320')
  })

  it('rejects junk and shows the cleaned value', async () => {
    const w = open()
    const input = field(w, '$50')
    await input.setValue('-abc')
    expect(input.element.value).toBe('')
    expect(total(w, 'bills')).toBe('$0')
    await w.get('#other').setValue('.')
    expect(total(w, 'grand')).toBe('$0')
    await w.get('#other').setValue('10.5')
    expect(total(w, 'grand')).toBe('$10.50')
  })

  it('remembers amounts', async () => {
    const w = open()
    await field(w, '$1,000').setValue('2')
    await nextTick()
    expect(total(open(), 'grand')).toBe('$2,000')
  })

  it.each(['not json', 'null', '7', '{"counts":{"500":"x"},"other":{}}'])(
    'survives bad storage: %s',
    (bad) => {
      localStorage.setItem(STORAGE_KEY, bad)
      expect(total(open(), 'grand')).toBe('$0')
    },
  )

  it('parses', () => {
    expect(['3', '1.9', '-2', '1234567', null].map(parseCount)).toEqual([3, 1, 2, 12345, 0])
    expect(['1,000', '1.2.345', '12.', 'x'].map(cleanMoney)).toEqual(['1000', '1.23', '12.', ''])
  })
})
