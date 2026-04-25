// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/logo192.png', // Твоя іконка
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        data: {
            url: '/' // Куди перейде юзер при кліку
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});