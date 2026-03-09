"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function PushSubscriptionManager() {
  const t = useTranslations("Notifications");
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setSupported(isSupported);

    if (!isSupported) {
      setLoading(false);
      return;
    }

    // Check current subscription status
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
        setLoading(false);
      });
    });
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("[push] Subscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setSubscribed(false);
    } catch (err) {
      console.error("[push] Unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-base font-medium text-gray-900">
          {t("pushNotifications")}
        </p>
        <p className="text-sm text-gray-500">
          {subscribed ? t("pushEnabled") : t("pushDisabled")}
        </p>
      </div>
      <button
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        className={`px-5 py-3 text-base font-medium rounded-lg transition-colors ${
          subscribed
            ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        } disabled:opacity-50`}
      >
        {loading
          ? "..."
          : subscribed
            ? t("disable")
            : t("enable")}
      </button>
    </div>
  );
}
