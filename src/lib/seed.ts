/**
 * BLOCKEXCHANGE default-account seeder.
 *
 * Idempotent — safe to call multiple times. Creates:
 *   - 1 Super Admin (crdbixx@gmail.com / bixby1122!!)
 *   - 5 Sub-Agents with invitation codes PB-AG001..PB-AG005
 *
 * ALL accounts have mustChangePassword=true — forced to change on first login.
 * Passwords are hashed with bcrypt (10 rounds). Never stored in plain text.
 */
import { db } from "@/lib/db";
import { hashPassword, generateUid } from "@/lib/api-auth";

const SEED_ACCOUNTS = [
  {
    name: "Super Admin",
    email: "crdbixx@gmail.com",
    password: "bixby1122!!",
    role: "SUPER_ADMIN",
    invitationCode: null as string | null,
    mustChangePassword: true,
  },
  {
    name: "SubAgent 1",
    email: "subagent1@trade.com",
    password: "bixby1122!!",
    role: "SUB_AGENT",
    invitationCode: "PB-AG001",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 2",
    email: "subagent2@trade2.com",
    password: "bixby1122!!",
    role: "SUB_AGENT",
    invitationCode: "PB-AG002",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 3",
    email: "subagent3@trade3.com",
    password: "bixby1122!!",
    role: "SUB_AGENT",
    invitationCode: "PB-AG003",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 4",
    email: "subagent4@trade4.com",
    password: "bixby1122!!",
    role: "SUB_AGENT",
    invitationCode: "PB-AG004",
    mustChangePassword: true,
  },
  {
    name: "SubAgent 5",
    email: "subagent5@trade5.com",
    password: "bixby1122!!",
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
