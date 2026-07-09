/**
 * Brock Exchange default-account seeder.
 *
 * All credentials are read from env vars — no hardcoded passwords in source.
 * Required env vars (see .env.example):
 *   - SEED_ADMIN_EMAIL
 *   - SEED_ADMIN_PASSWORD
 *   - SEED_SUBAGENT_PASSWORD  (shared default for all 5 sub-agents; they must change it on first login)
 *
 * Idempotent — safe to call multiple times. Creates:
 *   - 1 Super Admin (env-configured email + password)
 *   - 5 Sub-Agents (subagentN@trade.com / SEED_SUBAGENT_PASSWORD, codes PB-AG001..PB-AG005)
 *
 * Sub-Agent accounts are created with mustChangePassword=true so they are forced
 * to change the default password on first login.
 */
import { db } from "@/lib/db";
import { hashPassword, generateUid } from "@/lib/api-auth";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} is required for seeding. Set it in .env (see .env.example).`
    );
  }
  return v;
}

export async function seedDefaultAccounts(): Promise<{
  created: number;
  skipped: number;
  adminEmail: string;
  subAgentEmails: string[];
  invitationCodes: string[];
}> {
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const subAgentPassword = requireEnv("SEED_SUBAGENT_PASSWORD");

  const accounts = [
    {
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: "SUPER_ADMIN",
      invitationCode: null as string | null,
      mustChangePassword: false,
    },
    ...[1, 2, 3, 4, 5].map((n) => ({
      name: `SubAgent ${n}`,
      email: `subagent${n}@trade.com`,
      password: subAgentPassword,
      role: "SUB_AGENT",
      invitationCode: `PB-AG${String(n).padStart(3, "0")}`,
      mustChangePassword: true,
    })),
  ];

  let created = 0;
  let skipped = 0;

  for (const acc of accounts) {
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
    adminEmail,
    subAgentEmails: accounts.filter((a) => a.role === "SUB_AGENT").map((a) => a.email),
    invitationCodes: accounts.filter((a) => a.invitationCode).map((a) => a.invitationCode!),
  };
}
