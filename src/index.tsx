import React from "react";
import ReactDOM from "react-dom/client";
import "./css/main.css";
import "./css/main.scrollbar.css";
import "./css/main.varibles.css";
import "./css/main.basicElements.css";
import "./css/main.antdFix.css";
import App from "./sections/App";
import meta from "./meta";
import localforage from "localforage";
import { mountGetPx } from "./utils/misc";

if("serviceWorker" in window.navigator) window.navigator.serviceWorker.register("serviceworker.js");
else if(await localforage.getItem("alerted-no-offline") === null){
    localforage.setItem("alerted-no-offline", true);
    alert("您的浏览器不支持离线使用本应用。");
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
mountGetPx();
export async function load(fail? :boolean){
    if(fail) root.render(<React.StrictMode><div style={{width: "100dvw", height: "100dvh", display: "grid", placeItems: "center"}}><div>本应用因为出现一个致命问题而崩溃。请刷新重试，或联系管理员。</div></div></React.StrictMode>);
    else root.render(<React.StrictMode><App key={Date.now()} /></React.StrictMode>);
    return "重新加载完毕" as const;
}
load();

//DEV ONLY
if(meta.dev) Object.defineProperties(window, {
    "重新加载": {
        get(){
            return load();
        }
    },
    "删库跑路": {
        async get(){
            await localforage.clear();
            load();
            return 666;
        }
    }
});