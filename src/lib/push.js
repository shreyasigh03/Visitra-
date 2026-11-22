// Phone notifications for teachers.
import { apiFetch } from "./api";

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const getRegistration = () => navigator.serviceWorker.getRegistration("/");

export async function isPushOn() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const registration = await getRegistration();
  return Boolean(await registration?.pushManager.getSubscription());
}

function keyBytes(key) {
  const base64 = key.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function turnOnPush(pushKey) {
  if ((await Notification.requestPermission()) !== "granted") {
    throw new Error("Notifications are blocked. Allow them for this site in your browser settings.");
  }
  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pushKey) }));
  await apiFetch("/api/teacher/push", { method: "POST", body: { subscription: subscription.toJSON() }, auth: "teacher" });
}

// Called on logout, so the next person on this device gets no notifications.
export async function turnOffPush() {
  if (!pushSupported()) return;
  const subscription = await (await getRegistration())?.pushManager.getSubscription();
  if (!subscription) return;
  await apiFetch("/api/teacher/push/remove", { method: "POST", body: { endpoint: subscription.endpoint }, auth: "teacher" }).catch(() => {});
  await subscription.unsubscribe();
}
