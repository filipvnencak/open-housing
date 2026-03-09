import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, notificationPreferences } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { NotificationType } from "@/types";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function isConfigured(): boolean {
  return Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
) {
  if (!isConfigured()) return;

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

export async function sendPushToAll(
  payload: PushPayload,
  notificationType: NotificationType,
  userIds?: string[]
) {
  if (!isConfigured()) return;

  // Get all subscriptions (optionally filtered by userIds)
  const subscriptions = userIds?.length
    ? await db
        .select()
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.userId, userIds))
    : await db.select().from(pushSubscriptions);

  if (!subscriptions.length) return;

  // Get notification preferences to filter out users who opted out
  const uniqueUserIds = [...new Set(subscriptions.map((s) => s.userId))];
  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(inArray(notificationPreferences.userId, uniqueUserIds));

  const prefsMap = new Map(prefs.map((p) => [p.userId, p]));

  // Map notification type to preference column
  const prefKey: Record<NotificationType, "newPost" | "votingStarted"> = {
    newPost: "newPost",
    votingStarted: "votingStarted",
  };

  for (const sub of subscriptions) {
    const userPref = prefsMap.get(sub.userId);
    // Default is true if no preference row exists
    if (userPref && !userPref[prefKey[notificationType]]) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}
