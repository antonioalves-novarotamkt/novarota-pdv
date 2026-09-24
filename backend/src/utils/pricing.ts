export function calculateFinalPrice(basePrice: number, markupPercent: number): number {
  const finalPrice = basePrice * (1 + markupPercent / 100);
  return parseFloat(finalPrice.toFixed(2));
}

export function calculateMarkupPercent(basePrice: number, finalPrice: number): number {
  if (basePrice === 0) return 0;
  const markup = ((finalPrice - basePrice) / basePrice) * 100;
  return parseFloat(markup.toFixed(2));
}
