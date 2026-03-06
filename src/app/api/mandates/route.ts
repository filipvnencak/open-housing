import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mandates, votings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  // Only admin can create mandates
  if (!hasPermission(session.user.role as UserRole, "grantMandate")) {
    return NextResponse.json({ error: "Iba administrátor môže vytvárať splnomocnenia" }, { status: 403 });
  }

  const body = await request.json();
  const {
    votingId,
    fromFlatId,
    fromOwnerId,
    toOwnerId,
    paperDocumentConfirmed,
    verificationNote,
  } = body;

  if (!votingId || !fromFlatId || !fromOwnerId || !toOwnerId) {
    return NextResponse.json(
      { error: "votingId, fromFlatId, fromOwnerId a toOwnerId sú povinné" },
      { status: 400 }
    );
  }

  // Require paper document confirmation
  if (!paperDocumentConfirmed) {
    return NextResponse.json(
      { error: "Splnomocnenie vyžaduje potvrdenie listinného dokumentu s úradne osvedčeným podpisom" },
      { status: 400 }
    );
  }

  // Check voting is active
  const [voting] = await db
    .select()
    .from(votings)
    .where(eq(votings.id, votingId))
    .limit(1);

  if (!voting || voting.status !== "active") {
    return NextResponse.json(
      { error: "Hlasovanie nie je aktívne" },
      { status: 400 }
    );
  }

  // Check if mandate already exists for this flat in this voting
  const existing = await db
    .select()
    .from(mandates)
    .where(
      and(
        eq(mandates.votingId, votingId),
        eq(mandates.fromFlatId, fromFlatId),
        eq(mandates.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Pre tento byt už existuje aktívne splnomocnenie v tomto hlasovaní" },
      { status: 400 }
    );
  }

  // Chain mandate validation: check if toOwnerId already delegated from another flat
  const chainCheck = await db
    .select()
    .from(mandates)
    .where(
      and(
        eq(mandates.votingId, votingId),
        eq(mandates.fromOwnerId, toOwnerId),
        eq(mandates.isActive, true)
      )
    )
    .limit(1);

  if (chainCheck.length > 0) {
    return NextResponse.json(
      { error: "Príjemca splnomocnenia už delegoval svoj hlas — reťazenie splnomocnení nie je povolené" },
      { status: 400 }
    );
  }

  const [mandate] = await db
    .insert(mandates)
    .values({
      votingId,
      fromOwnerId,
      fromFlatId,
      toOwnerId,
      paperDocumentConfirmed: true,
      verifiedByAdminId: session.user.id,
      verificationDate: new Date(),
      verificationNote: verificationNote || null,
    })
    .returning();

  return NextResponse.json(mandate, { status: 201 });
}
