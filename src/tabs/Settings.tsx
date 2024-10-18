import React, { Component as Cp } from "react";
import localforage from "localforage";
import { Button, ConfigProvider, Popconfirm } from "antd";
import { UserData } from "../schema/user";
import { toUrl } from "../schema/dedicatedTypes";
import { whoami } from "../schema/login";

type Props = {
    ATFailCallBack :(message?: string)=>void;
    fromLucky :boolean;
};

type State = {
    accountInfo :UserData | null;
};

/**@once */
export default class Settings extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
        this.state = {
            accountInfo: null
        };
    }
    async componentDidMount(){
        const userData = await whoami();
        if(userData === null) this.props.ATFailCallBack("获取本账户数据失败");
        else this.setState({accountInfo: userData});
    }
    delete = ()=>{
        localforage.removeItem("username");
        localforage.removeItem("password");
        localforage.removeItem("access_token");
        window.location.href = ".";
    }
    render() :React.ReactNode{
        return(
            <div id="settings" style={{
                width: this.props.fromLucky ? "" : "calc(100dvw - 10rem)"
            }}>
                <div style={{
                    display: "flex",
                    margin: this.props.fromLucky ? "" : "3rem 3rem 0",
                    flexFlow: "column nowrap",
                    gap: "2rem",
                    overflowY: "auto",
                    minHeight: this.props.fromLucky ? "50dvh" : "calc(100dvh - 3rem)"
                }}>
                    <div style={{display: "inline-flex", flexFlow: "row nowarp", alignItems: "center", gap: ".25rem"}}>当前登录账号：{this.state.accountInfo ?
                        <>
                            <img width={40} height={40} src={toUrl(this.state.accountInfo.avatar)} />
                            {this.state.accountInfo.nickname}（{this.state.accountInfo.id}）
                        </>
                        : "加载中……"
                    }</div>
                    <ConfigProvider theme={{
                        components: {
                            Button: {
                                sizeSM: 18,
                                paddingBlockSM: ".9rem",
                                paddingInlineSM: ".75rem"
                            }
                        }
                    }}>
                        <div><Popconfirm title="手残确认" placement="bottom" description={<><p>确定要立刻退出管理后台</p><p>并删除账户的登录信息吗？</p></>} okButtonProps={{autoInsertSpace: false}} okType="danger" cancelButtonProps={{autoInsertSpace: false}} onConfirm={this.delete}><Button danger>退出登录并删除登录信息</Button></Popconfirm></div>
                    </ConfigProvider>
                </div>
            </div>
        );
    }
}