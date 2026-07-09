"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { Navbar } from "@/components/blockexchange/navbar";
import { Footer } from "@/components/blockexchange/footer";
import { HomeView } from "@/components/blockexchange/home-view";
import { AuthView } from "@/components/blockexchange/auth-view";
import { TradeView } from "@/components/blockexchange/trade-view";
import { WalletView } from "@/components/blockexchange/wallet-view";
import { AdminView } from "@/components/blockexchange/admin-view";
import { SubAgentDashboard } from "@/components/blockexchange/subagent-dashboard";
import { AdminLoginView } from "@/components/blockexchange/admin-login-view";
import { PasswordChangeModal } from "@/components/blockexchange/password-change-modal";
import { SupportChatWidget } from "@/components/blockexchange/support-chat-widget";
import { PWAInstallPrompt } from "@/components/blockexchange/pwa-install-prompt";
import { MobileTabBar } from "@/components/blockexchange/mobile-tab-bar";
import {
  MarketsView, WatchlistView, AssetsView, DepositView, WithdrawView,
  HistoryView, ProfileView, NotificationsView, SettingsView,
} from "@/components/blockexchange/extra-views";

export default function Home() {
  const { view, user, navigate, hydrated, syncFromUrl, setView } = useAuth();

  // Sync view from URL on mount (handles /storefront, /admin, /trade, etc.)
  useEffect(() => {
    syncFromUrl();
    if (!useAuth.getState().hydrated) {
      useAuth.setState({ hydrated: true });
    }
    const onPop = () => syncFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [syncFromUrl]);

  // Safety: keep view state in sync with auth state.
  useEffect(() => {
    if (!hydrated) return;
    const authRequired = ["trade", "wallet", "deposit", "withdraw", "history", "profile", "notifications", "settings", "watchlist", "assets"];
    if (authRequired.includes(view) && !user) navigate("login");
    if (authRequired.includes(view) && user && user.role !== "CUSTOMER") {
      navigate(user.role === "SUPER_ADMIN" ? "admin" : "subagent");
    }
    if (view === "admin" && (!user || user.role !== "SUPER_ADMIN")) setView("admin-login");
    if (view === "subagent" && (!user || user.role !== "SUB_AGENT")) setView("admin-login");
  }, [view, user, hydrated, navigate, setView]);

  // Standalone full-screen views (no storefront chrome)
  if (view === "admin-login") {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminLoginView />
      </div>
    );
  }

  // Staff dashboards render their own Navbar/Footer + password modal
  if (view === "subagent") {
    return (
      <div className="min-h-screen flex flex-col">
        <SubAgentDashboard />
      </div>
    );
  }
  if (view === "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <AdminView />
        </div>
        <Footer />
        <PasswordChangeModal />
      </div>
    );
  }

  // Storefront views
  const isAuthView = view === "login" || view === "register";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar minimal={isAuthView} />
      <div className="flex-1 flex flex-col pb-16 lg:pb-0">
        {view === "home" && <HomeView />}
        {view === "login" && <AuthView />}
        {view === "register" && <AuthView />}
        {view === "trade" && <TradeView />}
        {view === "wallet" && <WalletView />}
        {view === "markets" && <MarketsView />}
        {view === "watchlist" && <WatchlistView />}
        {view === "assets" && <AssetsView />}
        {view === "deposit" && <DepositView />}
        {view === "withdraw" && <WithdrawView />}
        {view === "history" && <HistoryView />}
        {view === "profile" && <ProfileView />}
        {view === "notifications" && <NotificationsView />}
        {view === "settings" && <SettingsView />}
      </div>
      <Footer />
      <SupportChatWidget />
      <PWAInstallPrompt />
      <PasswordChangeModal />
      {/* Mobile bottom tab bar — hidden on auth views + desktop */}
      {!isAuthView && <MobileTabBar />}
    </div>
  );
}
