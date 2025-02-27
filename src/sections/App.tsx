import { useEffect, useState } from "react";
import mainStyles from "../css/main.module.css";
import Login from "./Login";
import { ConfigProvider, message, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Panel from "./Panel";
import zhCN from "antd/locale/zh_CN";
import localforage from "localforage";
import { load } from "..";
import { isLoggedIn, login, LoginResponse } from "../schema/login";
import Lucky from "./lucky/Lucky";
import { NoticeType } from "antd/es/message/interface";

let reloginTimes = 0;

/**@once */
export default function App(){
    const
        [loggedIn, setLoggedIn] = useState(false),
        [loading, setLoading] = useState(true),
        [accountType, setAccountType] = useState<LoginResponse["type"]>("super"),
        [messageAPI, contextHolder] = message.useMessage(),
        loginSucceed = (responseData :LoginResponse)=>{
            localforage.setItem("access_token", responseData.access_token);
            setLoggedIn(true);
            localforage.setItem("type", responseData.type);
            setAccountType(responseData.type);
            setLoading(false);
        },
        sendMessage = (content :string, type :NoticeType)=>{
            messageAPI.open({
                content, type
            });
        },
        tryRelogin = async (message? :string)=>{
            setLoading(true);
            setLoggedIn(false);
            reloginTimes++;
            const
                username = await localforage.getItem<string>("username"),
                password = await localforage.getItem<string>("password");
            //存在登录信息，尝试自动重新登录
            if(reloginTimes <= 10 && username && password){
                login(username, password).catch((reason :any)=>{
                    messageAPI.open({
                        type: "error",
                        content: `自动重新登录遇到错误：${reason}`
                    });
                    setTimeout(()=>tryRelogin(), 1000);
                }).then(async (value :Response | void)=>{
                    if(value){
                        const response :LoginResponse = await value.json();
                        if(response.success) loginSucceed(response);
                        else{
                            messageAPI.open({
                                type: "warning",
                                content: "使用保存的账户信息登录失败，请检查！"
                            });
                            messageAPI.open({
                                type: "error",
                                content: response.message
                            });
                            setLoggedIn(false);
                            setLoading(false);
                        }
                    }
                });
            }
            //多次登录均失败，直接爆炸
            else if(reloginTimes > 5){
                messageAPI.open({
                    type: "error",
                    content: "尝试多次登录后仍无法正常登录，请联系管理员！"
                });
                setTimeout(()=>load(true), 5000);
            }
            //不记住信息，且登录过期
            else messageAPI.open({
                type: "error",
                content: message ?? "登录已过期，请重新登录"
            });
        };
    useEffect(()=>{
        (async ()=>{
            if(await isLoggedIn()){
                setAccountType(await localforage.getItem<LoginResponse["type"]>("type") ?? "super");
                setLoggedIn(true);
                setLoading(false);
            }
            else if(await localforage.getItem<string>("username") && await localforage.getItem<string>("password")) tryRelogin();
            else setLoading(false);
        })();
    }, []);
    return(
        <ConfigProvider locale={zhCN} wave={{disabled: true}} theme={{
            algorithm: accountType === "super" ? theme.darkAlgorithm : theme.defaultAlgorithm,
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
                    cellPaddingInline: 10,
                    headerBorderRadius: 0
                }
            }
        }}>
            {contextHolder}
            <div className={mainStyles.fullScreen} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {loading ? null : loggedIn ? accountType === "super" ? <Panel sendMessage={sendMessage} ATFailCallBack={tryRelogin} /> : <Lucky ATFailCallBack={tryRelogin} /> : <Login succeedCallBack={loginSucceed} />}
                {loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /> : null}
            </div>
        </ConfigProvider>
    );
}