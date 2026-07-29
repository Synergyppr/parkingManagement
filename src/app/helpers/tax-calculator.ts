/**
 * Tax Calculation Helper
 *
 * Handles tax calculations for valet parking transactions
 * Supports Puerto Rico state, municipal, and reduced state taxes
 */

import { PaymentTax, PaymentAmount, PaymentAmountDetail } from '@/app/types/payment';

/**
 * Tax rate configuration for Puerto Rico
 * Rates are represented as decimals (e.g., 0.0605 = 6.05%)
 */
export interface TaxRateConfig {
  stateTax?: number; // IVU - Impuesto sobre Ventas y Uso (Sales and Use Tax)
  municipalTax?: number; // Municipal tax
  reducedStateTax?: number; // Reduced state tax for certain services
}

/**
 * Default Puerto Rico tax rates for valet parking services
 */
export const DEFAULT_PR_TAX_RATES: TaxRateConfig = {
  stateTax: 0.0605, // 6.05% state tax
  municipalTax: 0.03, // 3% municipal tax
  reducedStateTax: 0.024, // 2.4% reduced state tax
};

/**
 * Rounds a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
function roundToDecimals(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculates individual tax amount
 * @param base - Base amount to calculate tax on
 * @param rate - Tax rate as decimal
 * @returns Rounded tax amount
 */
function calculateTaxAmount(base: number, rate: number): number {
  return roundToDecimals(base * rate);
}

/**
 * Generates tax breakdown array for payment request
 * @param baseAmount - Base amount before taxes
 * @param taxRates - Tax rate configuration
 * @returns Array of tax objects
 */
export function calculateTaxes(
  baseAmount: number,
  taxRates: TaxRateConfig = DEFAULT_PR_TAX_RATES
): PaymentTax[] {
  const taxes: PaymentTax[] = [];
  const roundedBase = roundToDecimals(baseAmount);

  if (taxRates.stateTax && taxRates.stateTax > 0) {
    taxes.push({
      kind: 'stateTax',
      amount: calculateTaxAmount(roundedBase, taxRates.stateTax),
      base: roundedBase,
    });
  }

  if (taxRates.municipalTax && taxRates.municipalTax > 0) {
    taxes.push({
      kind: 'municipalTax',
      amount: calculateTaxAmount(roundedBase, taxRates.municipalTax),
      base: roundedBase,
    });
  }

  if (taxRates.reducedStateTax && taxRates.reducedStateTax > 0) {
    taxes.push({
      kind: 'reducedStateTax',
      amount: calculateTaxAmount(roundedBase, taxRates.reducedStateTax),
      base: roundedBase,
    });
  }

  return taxes;
}

/**
 * Calculates total amount including all taxes
 * @param baseAmount - Base amount before taxes
 * @param taxRates - Tax rate configuration
 * @returns Total amount including taxes
 */
export function calculateTotalWithTaxes(
  baseAmount: number,
  taxRates: TaxRateConfig = DEFAULT_PR_TAX_RATES
): number {
  const taxes = calculateTaxes(baseAmount, taxRates);
  const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  return roundToDecimals(baseAmount + totalTax);
}

/**
 * Generates complete payment amount object for PlaceToPay
 * @param baseAmount - Base amount before taxes
 * @param currency - Currency code (default: USD)
 * @param taxRates - Tax rate configuration
 * @returns Complete payment amount object
 */
export function generatePaymentAmount(
  baseAmount: number,
  currency: string = 'USD',
  taxRates: TaxRateConfig = DEFAULT_PR_TAX_RATES,
  tip: number = 0
): PaymentAmount {
  const roundedBase = roundToDecimals(baseAmount);
  const roundedTip = roundToDecimals(tip);
  const taxes = calculateTaxes(roundedBase, taxRates);
  const totalBeforeTip = calculateTotalWithTaxes(roundedBase, taxRates);
  const total = roundToDecimals(totalBeforeTip + roundedTip);

  const details: PaymentAmountDetail[] = [];
  if (roundedTip > 0) {
    details.push({ kind: 'tip', amount: roundedTip });
  }

  return {
    currency,
    total,
    taxes,
    ...(details.length > 0 && { details }),
  };
}

/**
 * Calculates base amount from total (reverse calculation)
 * Useful when user enters total amount and we need to extract base + taxes
 *
 * @param totalAmount - Total amount including taxes
 * @param taxRates - Tax rate configuration
 * @returns Base amount before taxes
 */
export function calculateBaseFromTotal(
  totalAmount: number,
  taxRates: TaxRateConfig = DEFAULT_PR_TAX_RATES
): number {
  const totalTaxRate =
    (taxRates.stateTax || 0) +
    (taxRates.municipalTax || 0) +
    (taxRates.reducedStateTax || 0);

  const baseAmount = totalAmount / (1 + totalTaxRate);
  return roundToDecimals(baseAmount);
}

/**
 * Validates that payment amount matches expected calculations
 * @param amount - Payment amount to validate
 * @returns True if valid, false otherwise
 */
export function validatePaymentAmount(amount: PaymentAmount): boolean {
  if (!amount.taxes || amount.taxes.length === 0) {
    return true; // No taxes to validate
  }

  const calculatedTaxTotal = amount.taxes.reduce((sum, tax) => sum + tax.amount, 0);
  const baseAmount = amount.taxes[0]?.base || 0;
  const expectedTotal = roundToDecimals(baseAmount + calculatedTaxTotal);

  return Math.abs(expectedTotal - amount.total) < 0.01; // Allow 1 cent tolerance for rounding
}

/**
 * ECR Terminal Amounts Structure
 * Used for ECR terminal payment requests
 */
export interface ECRAmounts {
  total: string;
  base_state_tax: string;
  base_reduced_tax: string;
  tip: string;
  state_tax: string;
  reduced_tax: string;
  city_tax: string;
}

/**
 * Generates ECR amounts object for terminal payment request
 * @param totalAmount - Total amount to charge (including taxes)
 * @param taxRates - Tax rate configuration
 * @returns ECR amounts object with tax breakdown
 */
export function generateECRAmounts(
  totalAmount: number,
  taxRates: TaxRateConfig = DEFAULT_PR_TAX_RATES
): ECRAmounts {
  // Calculate base amount from total (reverse calculation)
  const baseAmount = calculateBaseFromTotal(totalAmount, taxRates);

  // Calculate individual tax amounts
  const stateTax = calculateTaxAmount(baseAmount, taxRates.stateTax || 0);
  const cityTax = calculateTaxAmount(baseAmount, taxRates.municipalTax || 0);
  const reducedTax = calculateTaxAmount(baseAmount, taxRates.reducedStateTax || 0);

  // Format all amounts as strings with 2 decimal places
  return {
    total: totalAmount.toFixed(2),
    base_state_tax: baseAmount.toFixed(2),
    base_reduced_tax: '0.00',
    tip: '0.00',
    state_tax: stateTax.toFixed(2),
    reduced_tax: reducedTax.toFixed(2),
    city_tax: cityTax.toFixed(2),
  };
}
