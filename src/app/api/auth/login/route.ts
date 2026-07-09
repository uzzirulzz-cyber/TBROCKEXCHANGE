import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword, toSafeUser, logLogin, logAction,
  isLegacyHash, upgradeLegacyHash,
} from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body ?? {};
    const emailStr = String(email ?? "").trim();

    if (!emailStr || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email: emailStr } });

    // Always log the attempt (even for unknown emails).
    if (!user) {
      await logLogin({ email: emailStr, req, success: false, reason: "UNKNOWN_EMAIL" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.frozen) {
      await logLogin({ userId: user.id, email: emailStr, req, success: false, reason: "FROZEN" });
      return NextResponse.json({ error: "Account is suspended. Contact support." }, { status: 403 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      await logLogin({ userId: user.id, email: emailStr, req, success: false, reason: "BAD_PASSWORD" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Auto-upgrade legacy SHA-256 hashes to bcrypt on successful login.
    // Fire-and-forget — must not block the login response.
    if (isLegacyHash(user.passwordHash)) {
      void upgradeLegacyHash(user.id, String(password));
    }

    await logLogin({ userId: user.id, email: emailStr, req, success: true });
    await logAction({ actorId: user.id, action: "LOGIN", detail: `${user.role} logged in` });

    const updated = await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return NextResponse.json({ user: toSafeUser(updated) });
  } catch (err) {
    console.error("[auth/login] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
