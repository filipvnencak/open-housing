import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { entrances, building, flats } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  const result = await db
    .select({
      id: entrances.id,
      name: entrances.name,
      streetNumber: entrances.streetNumber,
      buildingId: entrances.buildingId,
      createdAt: entrances.createdAt,
      flatCount: sql<number>`count(${flats.id})::int`,
    })
    .from(entrances)
    .leftJoin(flats, eq(flats.entranceId, entrances.id))
    .groupBy(entrances.id)
    .orderBy(entrances.name);

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
  const { name, streetNumber } = body;

  if (!name) {
    return NextResponse.json({ error: "Názov je povinný" }, { status: 400 });
  }

  const [bld] = await db.select().from(building).limit(1);
  if (!bld) {
    return NextResponse.json({ error: "Budova nenájdená" }, { status: 404 });
  }

  const [entrance] = await db
    .insert(entrances)
    .values({
      buildingId: bld.id,
      name,
      streetNumber: streetNumber || null,
    })
    .returning();

  return NextResponse.json(entrance, { status: 201 });
}
