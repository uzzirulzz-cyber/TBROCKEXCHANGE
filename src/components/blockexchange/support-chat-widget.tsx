"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Headset, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

interface Conv {
  id: string;
  subject: string;
  status: string;
}
interface Msg {
  id: string;
  body: string;
  senderRole: string;
  sender: { id: string; name: string; role: string };
  createdAt: string;
}

/**
 * Storefront embedded live-support chat widget.
 * Customers can open it from any page to start / continue a support conversation.
 * Staff (sub-agents + super-admin) see the full inbox in their dashboards.
 */
export function SupportChatWidget() {
  const { user, navigate } = useAuth();
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open the widget — loads or creates a conversation for the logged-in customer.
  async function handleOpen() {
    setOpen(true);
    if (!user || user.role !== "CUSTOMER") return;
    setLoading(true);
    try {
      // Try to find an existing OPEN conversation
      const listRes = await fetch("/api/messages/conversations", {
        headers: { "x-user-id": user.id },
      });
      const list = (await listRes.json().catch(() => ({}))) as { conversations?: Conv[] };
      let c = list.conversations?.find((x) => x.status === "OPEN");
      if (!c) {
        // Create a new one
        const createRes = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({ subject: "Support", initialMessage: "Hi! I need help." }),
        });
        const created = (await createRes.json().catch(() => ({}))) as { conversation?: Conv };
        c = created.conversation;
      }
      if (c) {
        setConv(c);
        await loadMessages(c.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`, {
        headers: { "x-user-id": user!.id },
      });
      const data = (await res.json().catch(() => ({}))) as { messages?: Msg[] };
      setMessages(data.messages ?? []);
    } catch {
      // ignore
    }
  }

  // Poll for new messages every 3s while open
  useEffect(() => {
    if (!open || !conv || !user) return;
    setPolling(true);
    const t = setInterval(() => loadMessages(conv.id), 3000);
    return () => {
      clearInterval(t);
      setPolling(false);
    };
  }, [open, conv, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !conv || !user) return;
    const body = text.trim();
    setText("");
    // Optimistic
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      body,
      senderRole: "CUSTOMER",
      sender: { id: user.id, name: user.name, role: user.role },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ conversationId: conv.id, body }),
      });
      if (!res.ok) toast.error("Failed to send message");
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <>
      {/* Floating launcher button — bottom-right */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpen}
            className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bx-blue-gradient bx-glow flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform"
            aria-label="Open support chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00c853] bx-pulse-dot border-2 border-[#050b18]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 h-[520px] bx-glass rounded-2xl bx-glow flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bx-glass-soft">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bx-blue-gradient flex items-center justify-center">
                  <Headset className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">BlockExchange Support</div>
                  <div className="text-[11px] text-[#00c853] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] bx-pulse-dot" />
                    Online · typically replies in minutes
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Headset className="w-10 h-10 text-[#0ea5ff] mb-3" />
                <p className="text-sm text-white font-medium mb-1">Login to chat with support</p>
                <p className="text-xs text-muted-foreground mb-4">
                  You need an account to start a support conversation.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("login");
                  }}
                  className="px-4 py-2 rounded-lg bx-blue-gradient text-white text-sm font-medium"
                >
                  Login
                </button>
              </div>
            ) : user.role !== "CUSTOMER" ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Staff inbox is available in your dashboard.
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#0ea5ff]" />
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto bx-scroll px-4 py-3 space-y-3"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8">
                      Start typing your message below. Our team will respond shortly.
                    </div>
                  )}
                  {messages.map((m) => {
                    const mine = m.senderRole === "CUSTOMER";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm ${
                            mine
                              ? "bx-blue-gradient text-white rounded-br-sm"
                              : "bg-white/[0.06] text-white rounded-bl-sm border border-white/5"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.body}</div>
                          <div
                            className={`text-[10px] mt-1 ${
                              mine ? "text-white/60" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <div className="p-3 border-t border-white/5 flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="flex-1 resize-none bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#0ea5ff] max-h-24"
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="w-10 h-10 shrink-0 rounded-xl bx-blue-gradient flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
