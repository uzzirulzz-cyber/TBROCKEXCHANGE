/**
 * Brock Exchange default-account seeder.
 *
 * Idempotent — safe to call multiple times. Creates:
 *   - 1 Super Admin (crdbixx@gmail.com / 123playbeat)
 *   - 5 Sub-Agents (subagentN@tradeN.com / default) with invitation codes PB-AG001..PB-AG005
 *
 * Sub-Agent accounts are created with mustChangePassword=true so they are forced
 * to change the default password on first login.
 *
 * Passwords are hashed with bcrypt (10 rounds). If any account was previously
 * seeded with the legacy SHA-256 hash, the login flow will auto-upgrade it to
 * bcrypt on next successful login.
 */
import { db } from "@/lib/db";
import { hashPassword, generateUid } from "@/lib/api-auth";

const SEED_ACCOUNTS = [
  {
    name: "Super Admin",
    email: "crdbixx@gmail.com",
    password: "123playbeat",
    role: "SUPER_ADMIN",
    invitationCode: null as string | null,
    mustChangePassword: false,
  },
  {
    name: "SubAgent 1",
    email: "subagent1@trade.com",
    password: "default",
    role: "SUB_AGENT",
    invitationCode: "PB-AG001",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 2",
    email: "subagent2@trade2.com",
    password: "default",
    role: "SUB_AGENT",
    invitationCode: "PB-AG002",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 3",
    email: "subagent3@trade3.com",
    password: "default",
    role: "SUB_AGENT",
    invitationCode: "PB-AG003",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 4",
    email: "subagent4@trade4.com",
    password: "default",
    role: "SUB_AGENT",
    invitationCode: "PB-AG004",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 5",
    email: "subagent5@trade5.com",
    password: "default",
    role: "SUB_AGENT",
    invitationCode: "PB-AG005",
    mustChangePassword: true,
  },
];

export async function seedDefaultAccounts(): Promise<{
  created: number;
  skipped: number;
  adminEmail: string;
  subAgentEmails: string[];
  invitationCodes: string[];
}> {
  let created = 0;
  let skipped = 0;

  for (const acc of SEED_ACCOUNTS) {
    const existing = await db.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      skipped++;
      continue;
    }
    const passwordHash = await hashPassword(acc.password);
    const uid = await generateUid();
    await db.user.create({
      data: {
        uid,
        name: acc.name,
        email: acc.email,
        passwordHash,
        role: acc.role,
        invitationCode: acc.invitationCode,
        mustChangePassword: acc.mustChangePassword,
        balance: acc.role === "SUPER_ADMIN" ? 999999 : 0,
        vipLevel: acc.role === "SUPER_ADMIN" ? 99 : 1,
        country: acc.role === "SUPER_ADMIN" ? "Global" : "",
        kycStatus: "VERIFIED",
        status: "ACTIVE",
      },
    });
    created++;
  }

  return {
    created,
    skipped,
    adminEmail: SEED_ACCOUNTS[0].email,
    subAgentEmails: SEED_ACCOUNTS.filter((a) => a.role === "SUB_AGENT").map((a) => a.email),
    invitationCodes: SEED_ACCOUNTS.filter((a) => a.invitationCode).map((a) => a.invitationCode!),
  };
}
