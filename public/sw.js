// Shows visitor notifications and opens the teacher dashboard when tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, { body, tag: url, icon: "/icon-192.png", data: { url } }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).pathname.toLowerCase() === "/teacherdashboard");
      if (!open) return self.clients.openWindow(url);
      await open.focus();
      return open.navigate(url).catch(() => self.clients.openWindow(url));
    })(),
  );
});
