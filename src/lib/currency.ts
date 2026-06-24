import { CURRENCIES } from '../constants';

export const formatCurrency = (amount: number, currencyCode: string) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return `${currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};
