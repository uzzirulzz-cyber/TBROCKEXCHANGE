import { NextResponse } from "next/server";
import { seedDefaultAccounts } from "@/lib/seed";

/** POST /api/auth/seed — idempotent. Returns seeded account metadata (never passwords). */
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
  } catch (err: any) {
    // Surface config errors clearly so the operator knows which env var is missing
    if (err?.message?.includes("is required")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
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
  } catch (err: any) {
    if (err?.message?.includes("is required")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[auth/seed] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
