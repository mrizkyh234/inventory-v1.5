/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number to Indonesian Rupiah (IDR) currency string.
 * Example: 150000 -> "Rp 150.000"
 */
export function formatIDR(value: number): string {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace(/\s/g, ' ');
}

/**
 * Computes platform fees.
 */
export function getPlatformFeeAmount(
  totalSale: number,
  feeType: 'rupiah' | 'persen',
  feeValue: number
): number {
  if (feeType === 'persen') {
    return (totalSale * (feeValue || 0)) / 100;
  }
  return feeValue || 0;
}

/**
 * Calculates transaction margin (live calculation).
 */
export function getMarginDetails(
  hargaJual: number,
  qty: number,
  hpp: number,
  platformFee: number,
  biayaOperasionalLuar: number
) {
  const totalOmset = hargaJual * qty;
  const totalHPP = hpp * qty;
  const sisa = totalOmset - totalHPP - platformFee - biayaOperasionalLuar;
  const persen = totalOmset > 0 ? (sisa / totalOmset) * 100 : 0;
  return {
    labaRupiah: sisa,
    labaPersen: persen,
  };
}
