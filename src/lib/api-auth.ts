/**
 * Brock Exchange API auth helpers — RBAC + bcrypt + audit logging.
 *
 * Roles: "CUSTOMER" | "SUB_AGENT" | "SUPER_ADMIN"
 *
 * Auth model: the client stores the safe user object (incl. id) in localStorage
 * after login and sends it back as the `x-user-id` header on every authed request.
 * The server re-validates the user exists in the DB on each call.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export type Role = "CUSTOMER" | "SUB_AGENT" | "SUPER_ADMIN";

export interface SafeUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: Role;
  balance: number;
  vipLevel: number;
  country: string;
  phone: string;
  mustChangePassword: boolean;
  invitationCode?: string | null;
  linkedSubAgentId?: string | null;
  photoUrl?: string;
  twoFactorEnabled?: boolean;
}

/** Strip a Prisma User row down to the fields safe to return to the client. */
export function toSafeUser(u: {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  vipLevel: number;
  country: string;
  phone?: string;
  mustChangePassword: boolean;
  invitationCode?: string | null;
  linkedSubAgentId?: string | null;
  photoUrl?: string | null;
  twoFactorEnabled?: boolean;
}): SafeUser {
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    name: u.name,
    role: (u.role === "SUPER_ADMIN" || u.role === "SUB_AGENT" ? u.role : "CUSTOMER") as Role,
    balance: u.balance,
    vipLevel: u.vipLevel,
    country: u.country,
    phone: u.phone ?? "",
    mustChangePassword: u.mustChangePassword,
    invitationCode: u.invitationCode ?? null,
    linkedSubAgentId: u.linkedSubAgentId ?? null,
    photoUrl: u.photoUrl ?? "",
    twoFactorEnabled: u.twoFactorEnabled ?? false,
  };
}

/** Generate a unique human-readable UID: BX-000001, BX-000002, ... */
export async function generateUid(): Promise<string> {
  const count = await db.user.count();
  const next = count + 1;
  return `BX-${String(next).padStart(6, "0")}`;
}

/** bcrypt hash (10 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a stored hash.
 *
 * Supports two hash formats:
 *  - bcrypt ($2a$ / $2b$ / $2y$ prefix) — current standard
 *  - SHA-256 hex (64-char lowercase hex) — legacy, from an older version of the codebase
 *
 * If a SHA-256 hash verifies successfully, the caller should re-hash with bcrypt
 * and persist the upgrade. Use `upgradeLegacyHash()` below.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // bcrypt hashes start with $2 and are ~60 chars
  if (hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }
  // Legacy SHA-256 hex (64 chars, lowercase)
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    const sha256 = createHash("sha256").update(password).digest("hex");
    return sha256.toLowerCase() === hash.toLowerCase();
  }
  return false;
}

/** True if a stored hash is the legacy SHA-256 format (needs upgrade to bcrypt). */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith("$2");
}

/** Re-hash a password with bcrypt. Called after a successful legacy-hash login. */
export async function upgradeLegacyHash(
  userId: string,
  password: string
): Promise<void> {
  try {
    const newHash = await hashPassword(password);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  } catch (err) {
    // upgrade failure must not break login — the old hash still works next time
    console.error("[upgradeLegacyHash] failed for user", userId, err);
  }
}

/**
 * Read the `x-user-id` header and load the user from the DB.
 * Returns null when the header is missing or the user does not exist / is frozen.
 */
export async function getAuthUser(req: NextRequest): Promise<SafeUser | null> {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return null;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.frozen) return null;
    return toSafeUser(user);
  } catch {
    return null;
  }
}

/** Require a specific role; returns the user or a 403 NextResponse. */
export async function requireRole(
  req: NextRequest,
  ...roles: Role[]
): Promise<{ user: SafeUser } | { error: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes(user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden — insufficient role" }, { status: 403 }),
    };
  }
  return { user };
}

/** Get client IP + user agent for audit logs. */
function getClientInfo(req: NextRequest): { ip: string; ua: string } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const ua = req.headers.get("user-agent") || "";
  return { ip, ua };
}

/** Log a login attempt (success or failure). Never throws. */
export async function logLogin(opts: {
  userId?: string | null;
  email: string;
  req: NextRequest;
  success: boolean;
  reason?: string;
}): Promise<void> {
  try {
    const { ip, ua } = getClientInfo(opts.req);
    await db.loginLog.create({
      data: {
        userId: opts.userId ?? null,
        email: opts.email,
        ip,
        userAgent: ua,
        success: opts.success,
        reason: opts.reason ?? "",
      },
    });
  } catch {
    // logging must never break the auth flow
  }
}

/** Log an admin/staff action. Never throws. */
export async function logAction(opts: {
  actorId?: string | null;
  action: string;
  targetId?: string | null;
  detail?: string;
}): Promise<void> {
  try {
    await db.actionLog.create({
      data: {
        actorId: opts.actorId ?? null,
        action: opts.action,
        targetId: opts.targetId ?? null,
        detail: opts.detail ?? "",
      },
    });
  } catch {
    // never break the calling flow
  }
}

/** Guard helper for sub-agent data isolation: returns the sub-agent's customer ids. */
export async function getSubAgentCustomerIds(subAgentId: string): Promise<string[]> {
  const customers = await db.user.findMany({
    where: { linkedSubAgentId: subAgentId, role: "CUSTOMER" },
    select: { id: true },
  });
  return customers.map((c) => c.id);
}
