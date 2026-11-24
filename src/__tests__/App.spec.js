import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import App from '../App.vue'
import { version } from '../../package.json'
import { parseCount, STORAGE_KEY } from '../stores/bills'

const open = () => mount(App, { global: { plugins: [createPinia()] } })
const field = (w, bill) => w.get(`[aria-label="Number of ${bill} bills"]`)
const text = (w, id) => w.get(`[data-testid="${id}"]`).text()
const total = (w) => text(w, 'total')

beforeEach(() => localStorage.clear())

describe('bill calculator', () => {
  it('matches the spreadsheet and updates on input alone', async () => {
    const w = open()
    await field(w, '$500').setValue('3')
    expect(total(w)).toBe('$1,500')
    await field(w, '$100').setValue('29')
    await field(w, '$20').setValue('8')
    expect(total(w)).toBe('$4,560')
    expect(text(w, 'bill-count')).toBe('40')
    await field(w, '$500').setValue('')
    expect(total(w)).toBe('$3,060')
  })

  it('rejects junk and shows the cleaned value', async () => {
    const w = open()
    const input = field(w, '$50')
    await input.setValue('-abc')
    expect(input.element.value).toBe('')
    expect(total(w)).toBe('$0')
  })

  it('draws one sheet per bill, and a bounded pile for large counts', async () => {
    const w = open()
    await field(w, '$20').setValue('3')
    expect(w.findAll('.sheets i')).toHaveLength(3)
    await field(w, '$5,000').setValue('99999')
    expect(w.findAll('.sheets i')).toHaveLength(61)
  })

  it('shows the version', () => {
    expect(open().get('footer').text()).toBe(`Version ${version}`)
  })

  it('remembers amounts', async () => {
    const w = open()
    await field(w, '$1,000').setValue('2')
    await nextTick()
    expect(total(open())).toBe('$2,000')
  })

  it.each(['not json', 'null', '7', '{"counts":{"500":"x"}}', '{"counts":{},"other":"100"}'])(
    'survives bad storage: %s',
    (bad) => {
      localStorage.setItem(STORAGE_KEY, bad)
      expect(total(open())).toBe('$0')
    },
  )

  it('parses', () => {
    expect(['3', '1.9', '-2', '1234567', null].map(parseCount)).toEqual([3, 1, 2, 12345, 0])
  })
})
