/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD5qEA5lWw8zaaiajNGGzIAQQLcQa_T39U",
  authDomain: "mrmagdy.firebaseapp.com",
  projectId: "mrmagdy",
  storageBucket: "mrmagdy.firebasestorage.app",
  messagingSenderId: "743280895249",
  appId: "1:743280895249:web:1bbbf2d121aed46c0218b0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Prevent default notification if one is already shown by webpush
  const notifTitle = payload.notification?.title || payload.data?.title || "إشعار جديد";
  const notifBody = payload.notification?.body || payload.data?.body || "";
  const type = payload.data?.type || "general";

  self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: "https://mrmagdy.lovable.app/pwa-192x192.png",
    badge: "https://mrmagdy.lovable.app/pwa-192x192.png",
    dir: "rtl",
    lang: "ar",
    tag: type,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    sound: "/notification-sound.mp3",
    data: {
      url: "https://mrmagdy.lovable.app/",
    },
    actions: [
      { action: "open", title: "فتح التطبيق" },
    ],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://mrmagdy.lovable.app/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("mrmagdy.lovable.app") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
