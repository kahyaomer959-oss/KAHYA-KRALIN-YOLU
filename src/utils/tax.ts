// Tax & Economy Helper Utilities

/**
 * Parses population strings like "15.7 Milyon", "983 Bin", "427 Bin", "2.4 Milyon" into numeric values.
 */
export function parsePopulationNumber(popStr: string | undefined): number {
  if (!popStr) return 100000;
  const str = popStr.trim().toLowerCase().replace(',', '.');
  
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch) return 100000;
  
  const val = parseFloat(numMatch[1]);
  if (isNaN(val)) return 100000;

  if (str.includes('milyon') || str.includes('million') || str.includes('m')) {
    return Math.round(val * 1000000);
  }
  if (str.includes('bin') || str.includes('thousand') || str.includes('k')) {
    return Math.round(val * 1000);
  }
  if (val < 1000) {
    return Math.round(val * 1000);
  }
  return Math.round(val);
}

/**
 * Calculates 1-month tax revenue for a single city according to user's formula:
 * (cityPopulation / 5) * (taxRatePercentage / 100)
 */
export function calculateCityMonthlyTax(population: number, taxRatePercentage: number): number {
  return Math.floor((population / 5) * (taxRatePercentage / 100));
}

/**
 * Calculates 1-day tax revenue for a single city (1 month = 30 days):
 * monthlyTax / 30
 */
export function calculateCityDailyTax(population: number, taxRatePercentage: number): number {
  const monthly = calculateCityMonthlyTax(population, taxRatePercentage);
  return Math.floor(monthly / 30);
}
