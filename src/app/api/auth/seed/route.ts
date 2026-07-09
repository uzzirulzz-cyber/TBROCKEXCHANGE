import { NextResponse } from "next/server";
import { seedDefaultAccounts } from "@/lib/seed";

/** POST /api/auth/seed — idempotent. Creates the 1 Super Admin + 5 Sub-Agents. */
export async function POST() {
  try {
    const result = await seedDefaultAccounts();
    return NextResponse.json({
      ok: true,
      created: result.created,
      skipped: result.skipped,
      adminEmail: result.adminEmail,
      subAgentEmails: result.subAgentEmails,
      invitationCodes: result.invitationCodes,
      message: `Seeded ${result.created} accounts, ${result.skipped} already existed.`,
    });
  } catch (err) {
    console.error("[auth/seed] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET also seeds (idempotent) so the frontend can trigger it on first admin-login load. */
export async function GET() {
  try {
    const result = await seedDefaultAccounts();
    return NextResponse.json({
      ok: true,
      created: result.created,
      skipped: result.skipped,
      adminEmail: result.adminEmail,
      subAgentEmails: result.subAgentEmails,
      invitationCodes: result.invitationCodes,
    });
  } catch (err) {
    console.error("[auth/seed] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
