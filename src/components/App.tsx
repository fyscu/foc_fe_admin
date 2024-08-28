import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import Login from "./Login";
import { ConfigProvider, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import config from "../config";
import Panel from "./Panel";
import zhCN from 'antd/locale/zh_CN';
import localforage from "localforage";

type State = {
    loading :boolean;
    loggedIn :boolean;
};

/**@once */
export default class App extends Cp<{}, State>{
    constructor(props :{}){
        super(props);
        this.state = {
            loggedIn: false,
            loading: true
        };
    }
    async componentDidMount(){
        const AT = await localforage.getItem("access_token");
        if(AT !== null){
            const result = await (await fetch(`${config.api}/v1/admin/getopenids`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${AT}`
                }
            })).json();
            this.setState({
                loggedIn: !result.error,
                loading: false
            });
        }
        else this.setState({
            loading: false,
            loggedIn: false
        });
    }
    loginSucceed = (accessToken :string)=>{
        this.setState({
            loading: false,
            loggedIn: true
        });
        localforage.setItem("access_token", accessToken);
    }
    ATFail = ()=>{
        this.setState({
            loggedIn: false,
            loading: false
        });
        localforage.removeItem("access_token");
    }
    render() :React.ReactNode{
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
                <div className={mainStyles.fullScreen} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    {this.state.loading ? null : this.state.loggedIn ? <Panel ATFailCallBack={this.ATFail} /> : <Login succeedCallBack={this.loginSucceed}/>}
                    {this.state.loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /> : null}
                </div>
            </ConfigProvider>
        );
    }
}