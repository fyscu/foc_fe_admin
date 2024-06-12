/*eslint-disable*/
const cacheName = "timetable", preCacheFiles = [
    //没有被引用但很可能需要的文件
];
self.addEventListener("install", ()=>{self.skipWaiting();});
self.addEventListener("activate", e=>{e.waitUntil(clients.claim());});
self.addEventListener("fetch", event=>{
    //排除扩展
    if(event.request.url.startsWith("chrome-extension://")) pass();
    //html文件，网络优先
    else if(event.request.url.endsWith(".html") || event.request.url.endsWith("/")) fetchFirst();
    //由于使用cra构建每次的contenthash不同，无需在联网时每次查找js和css的更新，只需查找主html是否更新。
    //其他文件离线优先即可，这样在没有更新的情况下只会下载html，大大加快速度
    else cacheFirst();
    function pass(){
        event.respondWith(fetch(event.request));
    }
    function fetchFirst(){
        event.respondWith(
            fetch(event.request)
            .catch(()=>caches.match(event.request))
            .then(fetchRespond=>processFetchRespond(fetchRespond))
        );
    }
    function cacheFirst(){
        event.respondWith(
            caches.match(event.request)
            .then(value=>{
                return value ?? fetch(event.request)
                .then(fetchRespond=>processFetchRespond(fetchRespond));
            })
        );
    }
    function processFetchRespond(fetchRespond){
        const fetchRespond_ = fetchRespond.clone();
        if(
            fetchRespond_
         && (fetchRespond_.status === 200 || fetchRespond_.status === 304 || fetchRespond_.type === "opaque")
         && event.request.method !== "POST"
            //只缓存 http(s) 协议
         && fetchRespond_.url.indexOf("http") === 0
        ) caches.open(cacheName).then(cache=>{
            cache.put(event.request, fetchRespond_);
        });
        return fetchRespond;
    }
});
self.addEventListener("message", event=>{ //接收客户端信息
    console.log("sw received message " + event.data);
    if(event.data === "clearcache"){
        navigator.storage.estimate().then(r=>{
            caches.has(cacheName).then(h=>{
                if(h){
                    const usage = r.usage;
                    caches.delete(cacheName);
                    sendMessageTo(event.source, `deleted${usage}`);
                }
                else sendMessageTo(event.source, "deleted0");
            });
        });
    }
    else if(typeof event.data == "function"){
        const result = event.data();
        sendMessageTo(event.source, result); //发送回复
    }
    //sendMessageTo(e.source,"");//发送回复
});
function sendMessageTo(l,m){
    return new Promise((y,n)=>{
        const c = new MessageChannel();
        c.port1.onmessage = e=>{
            if(e.data.error) n(e.data.error);
            else y(e.data);
        };
        l.postMessage(m, [c.port2]);
    });
}
//function sendMessageToAll(m){clients.matchAll().then(c=>{c.forEach(c=>{sendMessageTo(c,m).then(m=>console.log("sw received reply "+m));})})}