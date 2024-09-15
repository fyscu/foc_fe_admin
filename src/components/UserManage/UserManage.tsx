import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Pagination, Table, Tooltip } from "antd";
import meta from "../../meta";
import { ColumnsType } from "antd/es/table";
import { anyObject } from "../../main";
import Paragraph from "antd/es/typography/Paragraph";
import Text from "antd/es/typography/Text";
import { getPx } from "../../utils";

interface URLLike extends String{
    i_am_a_convertable_type_to_URL :never;
}

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

const FilterableFields = ["campus", "role", "available", "uid", "openid", "phone", "email", "immed"];

type State = {
    loading :boolean;
    datas :UserData[];
    currentPage :number;
    dataSize :number;
    filters :Record<typeof FilterableFields[number], string[]>;
};

type GetnumResponse = {
    success :boolean;
    total_users :number;
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
    columns :ColumnsType<UserData> = [
        {
            dataIndex: "id",
            title: "ID",
            align: "left",
            width: 80
        },
        {
            dataIndex: "openid",
            title: "openid",
            align: "left",
            ellipsis: true,
            width: 200,
            render: openid=>openid ? <div className="openid" style={{display: "flex", width: "100%", flexFlow: "row nowrap", gap: ".2rem"}}><Text copyable={{text: openid, tooltips: false}} /><div style={{maxWidth: "calc(100% - 15px - .2rem)"}}><div title={openid} style={{overflow: "hidden", textOverflow: "ellipsis"}}>{openid}</div></div></div> : "未迁移"
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
            //copyable: true
            align: "left",
            width: 170,
            render: (phone, entry)=><div className="phone" style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".25rem"}}>{entry.status === "verified" ? <Tooltip title="已验证"><CheckCircleFilled style={{color: "#136630", fontSize: "1.15rem"}} /></Tooltip> : <Tooltip title="未验证"><CloseCircleFilled style={{color: "#861a1a", fontSize: "1.15rem"}} /></Tooltip>}<Paragraph copyable={{tooltips: false}}>{phone}</Paragraph></div>,
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
            render: (token_expiry, entity)=>{
                if(token_expiry !== "0000-00-00 00:00:00"){
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
            datas: [],
            currentPage: 0,
            dataSize: 0,
            filters: {}
        };
    }
    componentDidMount(){
        this.updateTable();
    }
    updateTable = ()=>{
        this.getDataSize(this.state.filters);
        this.getData(this.state.filters, this.state.currentPage);
    }
    /**不需要基础 headers，已经默认填好了*/
    fetchData = async <T extends {}>(url :string | URL, method :"GET" | "POST", headers? :anyObject, body? :anyObject) :Promise<T | null>=>{
        const AT = await localforage.getItem("access_token");
        if(AT === null){
            this.props.ATFailCallBack("未登录，请先登录");
            return null;
        }
        const response = method === "GET" ? fetch(url, {
            headers: {
                ...headers,
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AT}`
            }, method: "GET"
        }) : fetch(url, {
            headers: {
                ...headers,
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AT}`
            }, method: "POST", body: JSON.stringify(body)
        });
        response.catch((reason :any)=>{
            this.props.ATFailCallBack("出现未知错误，请检查控制台");
            console.log(reason);
        });
        return await (await response).json();
    }
    getDataSize = async (filters :Record<string, (string | number)[] | null>)=>{
        const url = new URL(`${meta.apiDomain}/v1/admin/getnum/user`);
        url.searchParams.append("uid", "103650");
        const data = (await this.fetchData<GetnumResponse>(url, "GET"))!;
        console.log(data);
        if(data.success) this.setState({dataSize: data.total_users});
        //todo:看文档，这里是什么情况？
        else this.setState({dataSize: 0});
    }
    getData = async (filters :Record<string, (string | number)[] | null>, page :number)=>{
        const url = new URL(`${meta.apiDomain}/v1/status/getUser`);
        url.searchParams.append("uid", "103650");
        url.searchParams.append("page", page ? page + "" : "1");
        const data = (await this.fetchData<GetUserResponse>(url, "GET"))!;
        if(data.error){
            this.props.ATFailCallBack();
            this.setState({
                datas: [],
                loading: false
            });
        }
        console.log(data);
        this.setState({
            datas: data.data,
            loading: false
        });
    }
    render() :React.ReactNode{
        console.log(getPx("10rem"));
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
                <Table<UserData>
                    columns={this.columns}
                    rowKey={record=>record.id}
                    loading={this.state.loading}
                    dataSource={this.state.datas}
                    pagination={false}
                    scroll={{y: window.innerHeight - getPx("13rem") - 43}}
                />
                <div style={{
                    display: "flex",
                    flexFlow: "column nowrap",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "3rem"
                }}>
                    <Pagination defaultCurrent={1} current={this.state.currentPage} total={this.state.dataSize} />
                </div>
            </div>
        );
    }
}