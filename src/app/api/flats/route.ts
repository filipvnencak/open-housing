import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { flats, entrances, userFlats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  // If userId is provided, return flats for that user
  if (userId) {
    const result = await db
      .select({
        flatId: flats.id,
        flatNumber: flats.flatNumber,
        floor: flats.floor,
        entranceName: entrances.name,
      })
      .from(userFlats)
      .innerJoin(flats, eq(userFlats.flatId, flats.id))
      .leftJoin(entrances, eq(flats.entranceId, entrances.id))
      .where(eq(userFlats.userId, userId))
      .orderBy(flats.flatNumber);

    return NextResponse.json(result);
  }

  // Default: return all flats
  const result = await db
    .select({
      id: flats.id,
      flatNumber: flats.flatNumber,
      floor: flats.floor,
      area: flats.area,
      shareNumerator: flats.shareNumerator,
      shareDenominator: flats.shareDenominator,
      entranceId: flats.entranceId,
      entranceName: entrances.name,
    })
    .from(flats)
    .leftJoin(entrances, eq(flats.entranceId, entrances.id))
    .orderBy(entrances.name, flats.flatNumber);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  if (!hasPermission(session.user.role as UserRole, "manageSettings")) {
    return NextResponse.json({ error: "Nemáte oprávnenie" }, { status: 403 });
  }

  const body = await request.json();
  const { entranceId, flatNumber, floor, area, shareNumerator, shareDenominator } = body;

  if (!entranceId || !flatNumber || shareNumerator === undefined || shareDenominator === undefined) {
    return NextResponse.json(
      { error: "Vchod, číslo bytu, podiel čitateľ a menovateľ sú povinné" },
      { status: 400 }
    );
  }

  const [flat] = await db
    .insert(flats)
    .values({
      entranceId,
      flatNumber,
      floor: floor ?? 0,
      area: area || null,
      shareNumerator,
      shareDenominator,
    })
    .returning();

  return NextResponse.json(flat, { status: 201 });
}
