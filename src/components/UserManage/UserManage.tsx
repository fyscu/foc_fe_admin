import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import config from "../../config";
import { EditableProTable, ProColumns } from "@ant-design/pro-components";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Tooltip } from "antd";

interface URLLike extends String{
    i_am_a_convertable_type_to_URL :never;
}

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {
    loading :boolean;
    datas :UserData[];
};

type Params = {
    pageSize?: number;
    current?: number;
    keyword?: string;
};

type GetUserResponse = {
    success :boolean;
    request_type :"all" | "";
    data :UserData[];
    error? :string;
};

type UserData = {
    id :number;
    openid :string;
    token_expiry :string;
    regtime :string;
    nickname :string;
    avatar :URLLike;
    campus :"江安" | "望江" | "华西";
    role :"admin" | "technician" | "user";
    email :string;
    phone :string;
    status :"verified" | "pending";
    immed :"0" | "1";
    available :"0" | "1";
};

/**@once */
export default class UserManage extends Cp<Props, State>{
    columns :ProColumns<UserData, "text">[] = [
        {
            dataIndex: "id",
            title: "ID",
            align: "left",
            width: 75
        },
        {
            dataIndex: "openid",
            title: "openid",
            align: "left",
            copyable: true,
            ellipsis: true,
            width: 200,
            render: openid=>openid ?? "未迁移"
        },
        {
            dataIndex: "nickname",
            title: "昵称",
            align: "left",
            ellipsis: true,
            width: 125
        },
        {
            dataIndex: "campus",
            title: "校区",
            align: "left",
            width: 60
        },
        {
            dataIndex: "role",
            title: "类型",
            align: "left",
            width: 75,
            render: role=>role === "admin" ? "管理员" : role === "technician" ? "技术员" : "用户"
        },
        {
            dataIndex: "phone",
            title: "手机号",
            align: "left",
            width: 150,
            render: (phone, record)=><div style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".25rem"}}>{record.status === "verified" ? <Tooltip title="已验证"><CheckCircleFilled style={{color: "#136630", fontSize: "1.15rem"}} /></Tooltip> : <Tooltip title="未验证"><CloseCircleFilled style={{color: "#861a1a", fontSize: "1.15rem"}} /></Tooltip>}{phone}</div>,
            copyable: true
        },
        {
            dataIndex: "email",
            title: "邮件地址",
            align: "left"
        },
        {
            dataIndex: "token_expiry",
            title: "活跃时间",
            align: "left",
            render: token_expiry=>{
                if(typeof token_expiry === "string"){
                    const date = new Date(token_expiry);
                    date.setHours(date.getHours() - 1);
                    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${(date.getMinutes() + "").padStart(2, "0")}:${(date.getSeconds() + "").padStart(2, "0")}`;
                }
                else return "不活跃";
            },
            width: 150
        }
    ];
    constructor(props :Props){
        super(props);
        this.state = {
            loading: true,
            datas: []
        }
    }
    componentDidMount(){
        this.getData();
    }
    getData = async (params :{
        pageSize?: number;
        current?: number;
        keyword?: string;
    }, sort: Record<string, "descend" | "ascend" | null>, filter: Record<string, (string | number)[] | null>) :Promise<{
        data: UserData[] | undefined;
        success?: boolean;
        total?: number;
    }>=>{
        const AT = await localforage.getItem("access_token");
        if(AT === null) this.props.ATFailCallBack("未登录，请先登录");
        const url = new URL(`${config.api}/v1/status/getUser`);
        url.searchParams.append("limit", "1000");
        //url.searchParams.append("available", "0");
        url.searchParams.append("campus", "望江");
        //url.searchParams.append("role", "technician");
        //url.searchParams.append("page", "1");
        //console.log(url);
        const response = fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AT}`
            }
        });
        response.catch((reason :any)=>{
            this.props.ATFailCallBack("出现未知错误，请检查控制台");
            console.log(reason);
        });
        const data :GetUserResponse = await (await response).json();
        if(data.error) this.props.ATFailCallBack();
        console.log(data);
        return {
            data: data.data,
            success: data.success,
            total: data.data.length
        };
    }
    render() :React.ReactNode{
        return(
            <div id="users" style={{
                display: "flex",
                flexFlow: "column nowrap",
                width: "calc(100dvw - 10rem)"
            }}>
                <div style={{
                    height: "10rem"
                }}>
                    操作区
                </div>
                <EditableProTable<UserData>
                    style={{
                        width: "100%",
                        height: "100dvh",
                        overflowY: "auto"
                    }}
                    pagination={{
                        position: ["bottomCenter"],
                        pageSize: 20,
                        showQuickJumper: false,
                        showSizeChanger: false
                    }}
                    scroll={{
                        scrollToFirstRowOnChange: true
                    }}
                    request={this.getData}
                    rowKey="id"
                    maxLength={5}
                    recordCreatorProps={false}
                    columns={this.columns}
                />
            </div>
        );
        //return(<>
        //    <Table<UserData>
        //        pagination={{
        //            position: ["bottomRight"],
        //            pageSize: 20
        //        }}
        //        rowKey={record=>record.id}
        //        style={{
        //            width: "100%",
        //            overflowY: "auto"
        //        }}
        //        dataSource={this.state.datas}
        //    >
        //        <Column title="ID" dataIndex="id" align="center" key="id" />
        //        <Column title="昵称" dataIndex="nickname" ellipsis={{showTitle: true}} align="center" render={(nickname, record)=><div style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".4rem"}}><img width={33} height={33} src={record.avatar === "0.png" ? "0.png" : record.avatar}></img>{nickname}</div>} />
        //        <Column title="注册时间" dataIndex="regtime" ellipsis={{showTitle: false}} align="center" render={regtime=><Tooltip placement="topLeft" title={regtime}>{regtime}</Tooltip>} />
        //        <Column title="角色" dataIndex="role" align="center" render={role=>role === "admin" ? "管理员" : role === "technician" ? "技术员" : "用户"} />
        //        <Column title="校区" dataIndex="campus" align="center" />
        //        <Column title="邮箱地址" dataIndex="email" align="center" />
        //        <Column title="电话号码" dataIndex="phone" align="center" />
        //        <Column title="账号状态" dataIndex="status" align="center" render={status=>status === "pending" ? "未完善信息" : "正常"} />
        //    </Table>
        //    <ProTable>
        //        
        //    </ProTable>
        //</>);
    }
}

//type UserData = {
//    id :number;
//    //openid :string;
//    token_expiry :Datelike;
//    regtime :Datelike;
//    nickname :string;
//    avatar :URLLike;
//    campus :"江安" | "望江" | "华西";
//    role :"admin" | "technician" | "user";
//    email :string;
//    phone :string;
//    status :"verified" | "pending";
//};