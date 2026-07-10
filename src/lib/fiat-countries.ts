/**
 * BlockExchange — Fiat currency support with approved countries.
 *
 * Each approved country has:
 *  - name (display)
 *  - code (ISO 3166-1 alpha-2)
 *  - flag emoji
 *  - dial code (phone)
 *  - currency code (ISO 4217)
 *  - currency symbol
 *  - fiat methods available (bank transfer, card, etc.)
 */

export interface FiatCountry {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  currency: string;
  symbol: string;
  methods: string[]; // available fiat payment methods
}

export const FIAT_COUNTRIES: FiatCountry[] = [
  { name: "United States", code: "US", flag: "🇺🇸", dialCode: "+1", currency: "USD", symbol: "$", methods: ["BANK", "CARD", "WIRE"] },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", dialCode: "+44", currency: "GBP", symbol: "£", methods: ["BANK", "CARD", "FPS"] },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", dialCode: "+971", currency: "AED", symbol: "د.إ", methods: ["BANK", "CARD"] },
  { name: "Singapore", code: "SG", flag: "🇸🇬", dialCode: "+65", currency: "SGD", symbol: "S$", methods: ["BANK", "CARD", "PAYNOW"] },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", dialCode: "+92", currency: "PKR", symbol: "₨", methods: ["BANK", "CARD", "JAZZCASH", "EASYPASA"] },
  { name: "India", code: "IN", flag: "🇮🇳", dialCode: "+91", currency: "INR", symbol: "₹", methods: ["BANK", "CARD", "UPI", "IMPS", "NEFT", "RTGS"] },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", dialCode: "+880", currency: "BDT", symbol: "৳", methods: ["BANK", "CARD", "BKASH", "NAGAD", "ROCKET"] },
  { name: "Canada", code: "CA", flag: "🇨🇦", dialCode: "+1", currency: "CAD", symbol: "C$", methods: ["BANK", "CARD", "INTERAC"] },
  { name: "Australia", code: "AU", flag: "🇦🇺", dialCode: "+61", currency: "AUD", symbol: "A$", methods: ["BANK", "CARD", "PAYID"] },
  { name: "Germany", code: "DE", flag: "🇩🇪", dialCode: "+49", currency: "EUR", symbol: "€", methods: ["BANK", "CARD", "SEPA"] },
  { name: "France", code: "FR", flag: "🇫🇷", dialCode: "+33", currency: "EUR", symbol: "€", methods: ["BANK", "CARD", "SEPA"] },
  { name: "Brazil", code: "BR", flag: "🇧🇷", dialCode: "+55", currency: "BRL", symbol: "R$", methods: ["BANK", "CARD", "PIX"] },
  { name: "Mexico", code: "MX", flag: "🇲🇽", dialCode: "+52", currency: "MXN", symbol: "$", methods: ["BANK", "CARD", "SPEI"] },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", dialCode: "+27", currency: "ZAR", symbol: "R", methods: ["BANK", "CARD", "EFT"] },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", dialCode: "+234", currency: "NGN", symbol: "₦", methods: ["BANK", "CARD"] },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", dialCode: "+966", currency: "SAR", symbol: "﷼", methods: ["BANK", "CARD", "MADA"] },
  { name: "Qatar", code: "QA", flag: "🇶🇦", dialCode: "+974", currency: "QAR", symbol: "﷼", methods: ["BANK", "CARD"] },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", dialCode: "+965", currency: "KWD", symbol: "د.ك", methods: ["BANK", "CARD", "KNET"] },
  { name: "Oman", code: "OM", flag: "🇴🇲", dialCode: "+968", currency: "OMR", symbol: "﷼", methods: ["BANK", "CARD"] },
  { name: "Turkey", code: "TR", flag: "🇹🇷", dialCode: "+90", currency: "TRY", symbol: "₺", methods: ["BANK", "CARD"] },
  { name: "China", code: "CN", flag: "🇨🇳", dialCode: "+86", currency: "CNY", symbol: "¥", methods: ["BANK", "CARD", "ALIPAY", "WECHAT"] },
  { name: "Japan", code: "JP", flag: "🇯🇵", dialCode: "+81", currency: "JPY", symbol: "¥", methods: ["BANK", "CARD"] },
  { name: "South Korea", code: "KR", flag: "🇰🇷", dialCode: "+82", currency: "KRW", symbol: "₩", methods: ["BANK", "CARD", "KAKAO"] },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", dialCode: "+62", currency: "IDR", symbol: "Rp", methods: ["BANK", "CARD", "DANA", "OVO", "GOPAY"] },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", dialCode: "+60", currency: "MYR", symbol: "RM", methods: ["BANK", "CARD", "DUITNOW"] },
  { name: "Philippines", code: "PH", flag: "🇵🇭", dialCode: "+63", currency: "PHP", symbol: "₱", methods: ["BANK", "CARD", "GCASH", "MAYA"] },
  { name: "Thailand", code: "TH", flag: "🇹🇭", dialCode: "+66", currency: "THB", symbol: "฿", methods: ["BANK", "CARD", "PROMPTPAY"] },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", dialCode: "+84", currency: "VND", symbol: "₫", methods: ["BANK", "CARD", "MOMO"] },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", dialCode: "+94", currency: "LKR", symbol: "Rs", methods: ["BANK", "CARD"] },
  { name: "Nepal", code: "NP", flag: "🇳🇵", dialCode: "+977", currency: "NPR", symbol: "रू", methods: ["BANK", "CARD", "ESewA", "KHALTI"] },
];

/** Crypto methods always available. */
export const CRYPTO_METHODS = ["USDT", "BTC", "ETH", "BNB", "TRX"];

/** Get all available payment methods for a given country (crypto + fiat). */
export function getMethodsForCountry(countryName: string): string[] {
  const country = FIAT_COUNTRIES.find((c) => c.name === countryName);
  if (!country) return [...CRYPTO_METHODS, "BANK", "CARD"];
  return [...CRYPTO_METHODS, ...country.methods];
}

/** Get the fiat currency info for a country. */
export function getCountryCurrency(countryName: string): FiatCountry | null {
  return FIAT_COUNTRIES.find((c) => c.name === countryName) ?? null;
}

/** Convert country name to phone dial code. */
export function getDialCode(countryName: string): string {
  const country = FIAT_COUNTRIES.find((c) => c.name === countryName);
  return country?.dialCode ?? "+1";
}

/** All payment methods (for display / labels). */
export const ALL_PAYMENT_METHODS: Record<string, string> = {
  // Crypto
  USDT: "USDT (Tether)",
  BTC: "BTC (Bitcoin)",
  ETH: "ETH (Ethereum)",
  BNB: "BNB (Binance Coin)",
  TRX: "TRX (TRON)",
  // Fiat — Bank
  BANK: "Bank Transfer",
  WIRE: "Wire Transfer",
  SEPA: "SEPA Transfer",
  FPS: "Faster Payments",
  EFT: "EFT Transfer",
  INTERAC: "Interac e-Transfer",
  // Fiat — Card
  CARD: "Credit/Debit Card",
  MADA: "Mada Card",
  KNET: "KNET Card",
  // Fiat — Instant/Mobile
  UPI: "UPI",
  IMPS: "IMPS",
  NEFT: "NEFT",
  RTGS: "RTGS",
  PAYNOW: "PayNow",
  PAYID: "PayID",
  DUITNOW: "DuitNow",
  PROMPTPAY: "PromptPay",
  PIX: "Pix",
  SPEI: "SPEI",
  // Fiat — Mobile Wallets
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
  JAZZCASH: "JazzCash",
  EASYPASA: "EasyPaisa",
  ALIPAY: "Alipay",
  WECHAT: "WeChat Pay",
  KAKAO: "KakaoPay",
  DANA: "DANA",
  OVO: "OVO",
  GOPAY: "GoPay",
  GCASH: "GCash",
  MAYA: "Maya",
  MOMO: "MoMo",
  ESewA: "eSewa",
  KHALTI: "Khalti",
};
