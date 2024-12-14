/*eslint-disable*/
self.addEventListener("install", ()=>{self.skipWaiting();});
self.addEventListener("activate", e=>{e.waitUntil(clients.claim());});
self.addEventListener("fetch", event=>{
    //2024.10.19：本应用完全抛弃任何缓存功能！
    event.respondWith(fetch(event.request));
});