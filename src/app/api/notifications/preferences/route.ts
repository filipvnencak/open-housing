import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  const [pref] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id))
    .limit(1);

  return NextResponse.json(
    pref || { newPost: true, votingStarted: true }
  );
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 });
  }

  const body = await request.json();
  const { newPost, votingStarted } = body;

  // Check if preferences exist
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(notificationPreferences)
      .set({
        newPost: newPost ?? existing.newPost,
        votingStarted: votingStarted ?? existing.votingStarted,
      })
      .where(eq(notificationPreferences.userId, session.user.id))
      .returning();

    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(notificationPreferences)
    .values({
      userId: session.user.id,
      newPost: newPost ?? true,
      votingStarted: votingStarted ?? true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
