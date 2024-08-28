import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import config from "../config";
import { Button, ConfigProvider, Menu, Modal } from "antd";
import { ItemType, MenuItemType } from "antd/es/menu/interface";
import { BarChartOutlined, FlagOutlined, IdcardOutlined, UserOutlined } from "@ant-design/icons";
import localforage from "localforage";
import meta from "../meta";
import { MenuInfo } from "rc-menu/lib/interface";
import UserManage from "./UserManage/UserManage";

type Props = {
    ATFailCallBack :()=>void;
};

type State = {
    currentKey :string;
    aboutModalOpened :boolean;
};

/**@once */
export default class Panel extends Cp<Props, State>{
    static items :ItemType<MenuItemType>[] = [
        {
            key: "users",
            label: "用户管理",
            icon: <IdcardOutlined />
        },
        {
            key: "issues",
            label: "工单管理",
            icon: <UserOutlined />
        },
        {
            key: "events",
            label: "活动管理",
            icon: <FlagOutlined />
        },
        {
            key: "stats",
            label: "统计数据",
            icon: <BarChartOutlined />
        }
    ];
    constructor(props :Props){
        super(props);
        this.state = {
            currentKey: "users",
            aboutModalOpened: false
        };
    }
    changeTab = (info :MenuInfo)=>{
        this.setState({
            currentKey: info.key
        });
    }
    render() :React.ReactNode{
        return(
            <div className={mainStyles.fullScreen} style={{
                display: "flex",
                flexFlow: "row nowrap"
            }}>
                <Menu className={mainStyles.noselect}
                    style={{
                        width: "11rem",
                        height: "100dvh"
                    }}
                    defaultSelectedKeys={["users"]}
                    mode="inline"
                    items={Panel.items}
                    onClick={this.changeTab}
                />
                <div style={{
                    position: "absolute",
                    left: "1rem",
                    bottom: "1rem",
                    fontSize: ".9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                }}>
                    <div>{meta.version} {meta.dev ? "开发版" : ""}</div>
                    <div>
                        <ConfigProvider theme={{components: {Button: {paddingInline: 0, textHoverBg: "transparent", colorBgTextActive: "transparent"}}}}><Button type="text" onClick={()=>this.setState({aboutModalOpened: true})}>关于</Button></ConfigProvider>
                        <Modal
                            title="关于"
                            open={this.state.aboutModalOpened}
                            footer={null}
                            onCancel={()=>this.setState({aboutModalOpened: false})}
                            width={"20rem"}
                            closable={false}
                        >
                            <p>版本：{meta.version}</p>
                            <p>日期：{meta.date}</p>
                            <p>开发版：{meta.dev ? "true" : "false"}</p>
                            <p>开发者：<a href="//i.ljm.im" target="_blank">LJM12914</a></p>
                            <p><a href="//fyscu.com" target="_blank">四川大学飞扬俱乐部</a><a href="//lab.fyscu.com" target="_blank">研发部</a> 出品</p>
                        </Modal>
                    </div>
                </div>
                {this.state.currentKey === "users" ? <UserManage ATFailCallBack={this.props.ATFailCallBack} /> : null}
            </div>
        );
    }
}