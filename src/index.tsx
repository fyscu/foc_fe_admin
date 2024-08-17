import React from "react";
import ReactDOM from "react-dom/client";
import "./css/main.css";
import "./css/main.scrollbar.css";
import "./css/main.varibles.css";
import "./css/main.basicElements.css";
import "./css/main.antdFix.css";
import App from "./components/App";
import meta from "./meta";

if("serviceWorker" in window.navigator) window.navigator.serviceWorker.register("serviceworker.js");
else if(localStorage.getItem("alerted-no-offline") === null){
    localStorage.setItem("alerted-no-offline", "true");
    alert("您的浏览器不支持离线使用本应用。");
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
export async function load(){
    root.render(<React.StrictMode><App key={Date.now()} /></React.StrictMode>);
    console.log("???");
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
        get(){
            localStorage.clear();
            load();
            return 666;
        }
    }
});