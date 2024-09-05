import { useEffect, useState } from "react";
import mainStyles from "../css/main.module.css";
import Login from "./Login";
import { ConfigProvider, message, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import config from "../config";
import Panel from "./Panel";
import zhCN from 'antd/locale/zh_CN';
import localforage from "localforage";

/**@once */
export default function App(){
    const
        [loggedIn, setLoggedIn] = useState(false),
        [loading, setLoading] = useState(true),
        [messageAPI, contextHolder] = message.useMessage(),
        loginSucceed = (accessToken :string)=>{
            setLoggedIn(true);
            setLoading(false);
            localforage.setItem("access_token", accessToken);
        },
        ATFail = async ()=>{
            setLoggedIn(false);
            setLoading(false);
            const
                username = await localforage.getItem<string>("username"),
                password = await localforage.getItem<string>("password");
            if(username && password){

            }
            messageAPI.error("登录已过期");
            localforage.removeItem("access_token");
        };
    useEffect(()=>{
        //github desktop 测试
        (async ()=>{
            const result = await (await fetch(`${config.api}/v1/admin/getopenids`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer`
                }
            })).json();
            const AT = await localforage.getItem("access_token");
            if(AT !== null){
                const result = await (await fetch(`${config.api}/v1/admin/getopenids`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${AT}`
                    }
                })).json();
                setLoggedIn(!result.error);
                setLoading(false);
            }
            else{
                setLoggedIn(false);
                setLoading(false);
            }
        })();
    });
    return(
        <ConfigProvider locale={zhCN} theme={{
            algorithm: theme.darkAlgorithm,
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
                }
            }
        }}>
            {contextHolder}
            <div className={mainStyles.fullScreen} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {loading ? null : loggedIn ? <Panel ATFailCallBack={ATFail} /> : <Login succeedCallBack={loginSucceed}/>}
                {loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /> : null}
            </div>
        </ConfigProvider>
    );
}