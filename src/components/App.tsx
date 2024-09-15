import { useEffect, useState } from "react";
import mainStyles from "../css/main.module.css";
import Login, { LoginResponse } from "./Login";
import { ConfigProvider, message, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Panel from "./Panel";
import zhCN from 'antd/locale/zh_CN';
import localforage from "localforage";
import { load } from "../index";
import meta from "../meta";

/**@once */
export default function App(){
    const
        [loggedIn, setLoggedIn] = useState(false),
        [loading, setLoading] = useState(true),
        [messageAPI, contextHolder] = message.useMessage(),
        loginSucceed = (accessToken :string)=>{
            setLoading(false);
            setLoggedIn(true);
            localforage.setItem("access_token", accessToken);
        },
        tryRelogin = async (message? :string)=>{
            setLoggedIn(false);
            setLoading(true);
            const
                username = await localforage.getItem<string>("username"),
                password = await localforage.getItem<string>("password");
            if(username && password){
                const response :LoginResponse = await (await fetch(`${meta.apiDomain}/v1/admin/login`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({username, password})
                })).json();
                if(response.success){
                    loginSucceed(response.access_token);
                    //load();
                }
                else{
                    messageAPI.open({
                        type: "error",
                        content: response.message
                    });
                    messageAPI.open({
                        type: "warning",
                        content: "使用保存的账户信息登录失败，请检查！"
                    });
                }
            }
            else messageAPI.error(message ?? "登录已过期");
        };
    useEffect(()=>{
        (async ()=>{
            const AT = await localforage.getItem("access_token");
            if(AT !== null){
                const result = await (await fetch(`${meta.apiDomain}/v1/admin/getopenids`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${AT}`
                    }
                })).json();
                if(result.error){
                    if(await localforage.getItem<string>("username") && await localforage.getItem<string>("password")) tryRelogin();
                    else setLoggedIn(false);
                }
                else setLoggedIn(true);
            }
            else{
                if(await localforage.getItem<string>("username") && await localforage.getItem<string>("password")) tryRelogin();
                else setLoggedIn(false);
            }
            setLoading(false);
        })();
    });
    return(
        <ConfigProvider locale={zhCN} theme={{
            algorithm: theme.darkAlgorithm,
            token: {
                fontSize: 15
            },
            components: {
                Message: {
                    contentBg: "var(--c-grey--3)"
                },
                Menu: {
                    itemBorderRadius: 4,
                    itemSelectedColor: "var(--c-main)",
                    itemHeight: "3rem",
                    itemBg: "var(--c-grey--5)",
                    fontSize: 15
                },
                Table: {
                    cellPaddingBlock: 10,
                    cellPaddingInline: 10
                }
            }
        }}>
            {contextHolder}
            <div className={mainStyles.fullScreen} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {loading ? null : loggedIn ? <Panel ATFailCallBack={tryRelogin} /> : <Login succeedCallBack={loginSucceed} />}
                {loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /> : null}
            </div>
        </ConfigProvider>
    );
}