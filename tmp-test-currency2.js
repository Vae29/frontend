function parseMoneyValue(value) {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  let str = String(value).trim()
  if (!str) return 0
  const negative = str.includes('-')
  str = str.replace(/\s+/g, '').replace(/[^0-9.,]/g, '')
  if (!str) return 0

  const hasDot = str.includes('.')
  const hasComma = str.includes(',')

  if (hasDot && hasComma) {
    const lastComma = str.lastIndexOf(',')
    str = str.slice(0, lastComma).replace(/[.,]/g, '')
  } else if (hasDot) {
    const parts = str.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '')
    } else {
      const decimalMatch = str.match(/(\.(\d{1,2}))$/)
      str = decimalMatch ? str.slice(0, decimalMatch.index) : str.replace(/\./g, '')
    }
  } else if (hasComma) {
    const parts = str.split(',')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '')
    } else {
      const decimalMatch = str.match(/(,(\d{1,2}))$/)
      str = decimalMatch ? str.slice(0, decimalMatch.index) : str.replace(/,/g, '')
    }
  }

  const normalized = str.replace(/[.,]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : 0
}

function parseCurrencyParameter(value) {
  if (value == null) return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  let str = String(value).trim()
  if (!str) return NaN
  str = str.replace(/\s+/g, '').replace(/[^0-9,\.]/g, '')
  if (!str) return NaN

  const decimalMatch = str.match(/([.,])(\d{1,2})$/)
  if (decimalMatch) {
    str = str.slice(0, decimalMatch.index)
  }

  const normalized = str.replace(/[.,]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

const tests = ['700', '900', '40.000', '700.000', '1.234.567', '1.234.567,89'];
for (const value of tests) {
  console.log(value, 'parseMoneyValue=', parseMoneyValue(value), 'parseCurrencyParameter=', parseCurrencyParameter(value));
}
