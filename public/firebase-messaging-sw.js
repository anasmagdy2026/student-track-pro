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
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
    });
  }
});
