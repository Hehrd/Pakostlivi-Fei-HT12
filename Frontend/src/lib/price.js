export function centsToCurrencyValue(value) {
  return Number((Number(value ?? 0) / 100).toFixed(2));
}

export function currencyValueToCents(value) {
  return Math.round(Number(value ?? 0) * 100);
}
