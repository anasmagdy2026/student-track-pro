// Firebase initialization for push notifications inside PWA service worker
// This file is injected into the Workbox-generated SW via importScripts in vite.config.ts

// Initialize Firebase in the service worker context
// firebase-app-compat.js and firebase-messaging-compat.js are already loaded via importScripts
if (typeof firebase !== 'undefined') {
  firebase.initializeApp({
    apiKey: "AIzaSyD5qEA5lWw8zaaiajNGGzIAQQLcQa_T39U",
    authDomain: "mrmagdy.firebaseapp.com",
    projectId: "mrmagdy",
    storageBucket: "mrmagdy.firebasestorage.app",
    messagingSenderId: "743280895249",
    appId: "1:743280895249:web:1bbbf2d121aed46c0218b0",
  });

  const messaging = firebase.messaging();

  // Handle data-only messages in background
  messaging.onBackgroundMessage((payload) => {
    console.log("[PWA-SW] Background message received:", payload);

    const data = payload.data || {};
    const notifTitle = data.title || "إشعار جديد";
    const notifBody = data.body || "";
    const type = data.type || "general";
    const iconUrl = data.icon || "https://mrmagdy.lovable.app/pwa-192x192.png";
    const clickUrl = data.click_url || "https://mrmagdy.lovable.app/";

    const options = {
      body: notifBody,
      icon: iconUrl,
      badge: iconUrl,
      dir: "rtl",
      lang: "ar",
      tag: type + "-" + Date.now(),
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: { url: clickUrl },
      actions: [
        { action: "open", title: "فتح التطبيق" },
        { action: "dismiss", title: "تجاهل" },
      ],
    };

    self.registration.showNotification(notifTitle, options);
  });
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  if (action === "dismiss") return;

  const url = event.notification.data?.url || "https://mrmagdy.lovable.app/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("mrmagdy") && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

// Handle push event directly as fallback
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    if (payload.notification) return;

    const data = payload.data || {};
    if (!data.title) return;

    const options = {
      body: data.body || "",
      icon: data.icon || "https://mrmagdy.lovable.app/pwa-192x192.png",
      badge: data.icon || "https://mrmagdy.lovable.app/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
      tag: (data.type || "general") + "-" + Date.now(),
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: { url: data.click_url || "https://mrmagdy.lovable.app/" },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (e) {
    console.error("[PWA-SW] Push parse error:", e);
  }
});
