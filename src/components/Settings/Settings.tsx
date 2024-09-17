import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import styles from "./Settings.module.css";
import { Button, ConfigProvider, Popconfirm } from "antd";

type Props = {

};

type State = {

};

/**@once */
export default class Settings extends Cp<Props, State>{
    delete = ()=>{
        localforage.removeItem("username");
        localforage.removeItem("password");
        localforage.removeItem("access_token");
        window.location.href = ".";
    }
    render() :React.ReactNode{
        return(
            <div id="settings" style={{
                width: "calc(100dvw - 10rem)",
                padding: "3rem 3rem 0"
            }}>
                <div style={{
                    display: "flex",
                    flexFlow: "column nowrap",
                    gap: "3rem",
                    overflowY: "auto"
                }}>
                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                sizeSM: 18,
                                paddingBlockSM: ".9rem",
                                paddingInlineSM: ".75rem"
                            }
                        }
                    }}>
                        <div><Popconfirm title="手残确认" description={<><p>确定要立刻退出管理后台</p><p>并删除账户的登录信息吗？</p></>} okButtonProps={{autoInsertSpace: false}} okType="danger" cancelButtonProps={{autoInsertSpace: false}} onConfirm={this.delete}><Button danger>退出并删除登录信息</Button></Popconfirm></div>
                    </ConfigProvider>
                </div>
            </div>
        );
    }
}