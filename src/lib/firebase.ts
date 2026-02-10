import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD5qEA5lWw8zaaiajNGGzIAQQLcQa_T39U",
  authDomain: "mrmagdy.firebaseapp.com",
  projectId: "mrmagdy",
  storageBucket: "mrmagdy.firebasestorage.app",
  messagingSenderId: "743280895249",
  appId: "1:743280895249:web:1bbbf2d121aed46c0218b0",
};

const VAPID_KEY = "BKhnhPVvurzfnb_mhGCwRtvdLls2t90KeBNS0Xk4GWZU9wGjX7HLC3P98VAoww6FA_Wq2tBmYTJezRJdWml4x_k";

const app = initializeApp(firebaseConfig);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    // Register the service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  getMessagingInstance().then((messaging) => {
    if (messaging) {
      onMessage(messaging, callback);
    }
  });
}
