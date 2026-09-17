const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatterWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});


export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return Number.isInteger(value) ? currencyFormatterWhole.format(value) : currencyFormatter.format(value);
}