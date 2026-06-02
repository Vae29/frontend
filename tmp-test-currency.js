import { parseCurrencyParameter } from './src/services/cultivoService.js';
import { parseMoneyValue } from './src/pages/worker-panel.jsx';

const tests = ['700', '900', '40.000', '700.000', '1.234.567', '1.234.567,89'];
for (const value of tests) {
  console.log(value, 'parseCurrencyParameter=', parseCurrencyParameter(value), 'parseMoneyValue=', parseMoneyValue(value));
}
