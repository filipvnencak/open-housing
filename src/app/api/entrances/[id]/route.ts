import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { entrances, flats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  if (!hasPermission(session.user.role as UserRole, "manageSettings")) {
    return NextResponse.json({ error: "Nemáte oprávnenie" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, streetNumber } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (streetNumber !== undefined) updateData.streetNumber = streetNumber;

  const [updated] = await db
    .update(entrances)
    .set(updateData)
    .where(eq(entrances.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Vchod nenájdený" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  if (!hasPermission(session.user.role as UserRole, "manageSettings")) {
    return NextResponse.json({ error: "Nemáte oprávnenie" }, { status: 403 });
  }

  const { id } = await params;

  // Check if entrance has flats
  const entranceFlats = await db
    .select({ id: flats.id })
    .from(flats)
    .where(eq(flats.entranceId, id))
    .limit(1);

  if (entranceFlats.length > 0) {
    return NextResponse.json(
      { error: "Nemožno zmazať vchod s bytmi. Najprv zmažte byty." },
      { status: 400 }
    );
  }

  const [deleted] = await db
    .delete(entrances)
    .where(eq(entrances.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Vchod nenájdený" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
