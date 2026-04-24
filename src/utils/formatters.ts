import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format a number as currency in Bolivianos (BOB).
 */
export function formatCurrency(amount: number, currency = 'BOB'): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string to a human-readable date.
 */
export function formatDate(iso: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(iso), fmt, { locale: es });
  } catch {
    return iso;
  }
}

/**
 * Format an ISO date to short month+year label for charts.
 */
export function formatMonthLabel(iso: string): string {
  try {
    return format(parseISO(iso + '-01'), 'MMM yy', { locale: es });
  } catch {
    return iso;
  }
}

/**
 * Returns a color class based on percentage (for budget/stock indicators).
 */
export function getPctColor(pct: number): string {
  if (pct >= 90) return '#ef4444'; // danger
  if (pct >= 70) return '#f59e0b'; // warning
  return '#22c55e';                // success
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns today's date as ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
