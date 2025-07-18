// src/utils/formatCurrency.js
/**
 * Memformat angka menjadi string mata uang Rupiah (IDR).
 * @param {number} amount - Jumlah angka yang akan diformat.
 * @param {object} options - Opsi tambahan untuk Intl.NumberFormat.
 * @returns {string} String mata uang yang sudah diformat (misalnya, "Rp150.000").
 */
export function formatCurrencyIDR(amount, options = {}) {
  const defaultOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // Rupiah biasanya tidak menggunakan sen desimal
    maximumFractionDigits: 0,
  };

  // Gabungkan default options dengan options yang diberikan
  const formattingOptions = { ...defaultOptions, ...options };

  // Tangani jika amount bukan angka atau null/undefined
  if (typeof amount !== 'number' || isNaN(amount)) {
    // Anda bisa mengembalikan default seperti Rp0 atau string kosong, atau throw error
    // Untuk konsistensi, kita format angka 0 jika input tidak valid
    return new Intl.NumberFormat('id-ID', formattingOptions).format(0);
  }

  return new Intl.NumberFormat('id-ID', formattingOptions).format(amount);
}