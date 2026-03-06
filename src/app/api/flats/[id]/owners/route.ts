import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userFlats, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select({
      userId: users.id,
      userName: users.name,
    })
    .from(userFlats)
    .innerJoin(users, eq(userFlats.userId, users.id))
    .where(eq(userFlats.flatId, id));

  return NextResponse.json(result);
}
