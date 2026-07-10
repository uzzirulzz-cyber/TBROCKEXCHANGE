"use client";

import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-store";

export function Footer() {
  const { navigate } = useAuth();
  return (
    <footer className="mt-auto border-t border-white/5 bx-glass-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo size={36} tagline />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The next-generation crypto trading platform. Predict markets, trade smart, grow your portfolio.
            </p>
          </div>

          <FooterCol
            title="Platform"
            links={[
              { label: "Home", onClick: () => navigate("home") },
              { label: "Trade", onClick: () => navigate("trade") },
              { label: "Markets", onClick: () => navigate("home") },
              { label: "Fees", onClick: () => navigate("home") },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { label: "Login", onClick: () => navigate("login") },
              { label: "Register", onClick: () => navigate("register") },
              { label: "Admin Panel", onClick: () => navigate("admin") },
              { label: "Storefront", onClick: () => navigate("home") },
              { label: "Support", onClick: () => navigate("home") },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Terms of Service", onClick: () => {} },
              { label: "Privacy Policy", onClick: () => {} },
              { label: "KYC Policy", onClick: () => {} },
              { label: "Risk Disclosure", onClick: () => {} },
            ]}
          />
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BlockExchange. All rights reserved. support@blockexchange.buzz
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] bx-pulse-dot" />
              All systems operational
            </span>
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; onClick: () => void }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wider uppercase text-white/80">{title}</h4>
      <ul className="mt-4 space-y-2">
        {links.map((l, i) => (
          <li key={i}>
            <button
              onClick={l.onClick}
              className="text-sm text-muted-foreground hover:text-[#0ea5ff] transition-colors"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
