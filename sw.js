// خدمة عاملة بسيطة لتطبيق "معاك"
// وظيفتها: (1) تمكين تثبيت التطبيق على الشاشة الرئيسية (PWA)
// (2) تخزين الصفحة الرئيسية مؤقتاً حتى تفتح بسرعة حتى مع ضعف الاتصال
// ملاحظة: هذا لا يفعّل إشعارات push حقيقية بعد إغلاق المتصفح تماماً — ذلك يتطلب خادم (Firebase Cloud Functions + FCM)

const CACHE_NAME = 'maak-app-cache-v1';
const CACHE_FILES = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => Promise.all(
            names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        ))
    );
    self.clients.claim();
});

// استراتيجية: الشبكة أولاً، وإذا فشلت نرجع للنسخة المخزنة (تعمل بدون إنترنت لو زار الصفحة قبل كذا)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// يسمح بعرض إشعار محلي فوري ما دام المتصفح شغّال (حتى لو التبويب في الخلفية)
// يُستدعى هذا من صفحة التطبيق نفسها عبر navigator.serviceWorker.controller.postMessage(...)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title || 'تطبيق معاك', {
            body: event.data.body || '',
            icon: './icon-192.png',
            badge: './icon-192.png',
            dir: 'rtl',
            lang: 'ar'
        });
    }
});
