import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trades: true } },
      },
    });

    const safe = users.map((u) => ({
      id: u.id,
      uid: u.uid,
      email: u.email,
      name: u.name,
      role: u.role,
      balance: u.balance,
      frozenFunds: u.frozenFunds,
      vipLevel: u.vipLevel,
      country: u.country,
      phone: u.phone,
      kycStatus: u.kycStatus,
      status: u.status,
      frozen: u.frozen,
      walletLocked: u.walletLocked,
      invitationCode: u.invitationCode,
      linkedSubAgentId: u.linkedSubAgentId,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      tradesCount: u._count.trades,
    }));

    return NextResponse.json({ users: safe });
  } catch (err) {
    console.error("[admin/users] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
