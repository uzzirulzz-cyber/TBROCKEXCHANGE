import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  showText?: boolean;
  tagline?: boolean;
  className?: string;
}

/**
 * BlockExchange brand mark — uses the official logo image from /public/blockexchange-logo.png
 * Tagline: "your home for profits"
 */
export function Logo({ size = 40, showText = true, tagline = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <img
        src="/blockexchange-logo.png"
        alt="BlockExchange logo"
        width={size}
        height={size}
        className="rounded-lg"
        style={{ width: size, height: size, objectFit: "contain" }}
      />

      {showText && (
        <div className="leading-none">
          <div className="text-lg font-bold tracking-tight text-white uppercase">
            BlockExchange
          </div>
          {tagline && (
            <div className="mt-1 text-[10px] tracking-[0.2em] text-[#00B4DB] uppercase">
              your home for profits
            </div>
          )}
        </div>
      )}
    </div>
  );
}
