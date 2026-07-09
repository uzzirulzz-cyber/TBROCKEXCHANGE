import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * VIP level naming convention with symbols.
 *
 * Mapping:
 *   1  → 🥉 VIP-1
 *   2  → 🥈 VIP-2
 *   3  → 🥇 superVIP
 *   4  → 🥈 Prime_Silver
 *   5  → 🥇 Prime_Gold
 *   6+ → 💎 Prime_Diamond
 *   99 → 👑 Super Admin
 */
export function getVipLabel(level: number): string {
  if (level >= 99) return "👑 Super Admin";
  switch (level) {
    case 1: return "🥉 VIP-1";
    case 2: return "🥈 VIP-2";
    case 3: return "🥇 superVIP";
    case 4: return "🥈 Prime_Silver";
    case 5: return "🥇 Prime_Gold";
    default: return "💎 Prime_Diamond";
  }
}

/** Short form (no symbol) for compact UI. */
export function getVipShort(level: number): string {
  if (level >= 99) return "Super Admin";
  switch (level) {
    case 1: return "VIP-1";
    case 2: return "VIP-2";
    case 3: return "superVIP";
    case 4: return "Prime_Silver";
    case 5: return "Prime_Gold";
    default: return "Prime_Diamond";
  }
}

/** Color for VIP badge. */
export function getVipColor(level: number): string {
  if (level >= 99) return "#FF453A";
  switch (level) {
    case 1: return "#8E8E93";
    case 2: return "#8E8E93";
    case 3: return "#FF9F0A";
    case 4: return "#AEAEB2";
    case 5: return "#FFD60A";
    default: return "#0A84FF";
  }
}

