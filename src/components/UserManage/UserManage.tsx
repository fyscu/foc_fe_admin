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
import { getPx, iniLocalforage } from "../../utils";
import { SorterResult, TablePaginationConfig } from "antd/es/table/interface";

interface URLLike extends String{
    i_am_a_convertable_type_to_URL :never;
}

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

const FilterableFields = ["campus", "role", "available", "uid", "openid", "phone", "email", "immed"] as const;

type State = {
    loading :boolean;
    datas :UserData[];
    currentPage :number;
    dataSize :number;
    pageSize :number;
    filters :Partial<Record<typeof FilterableFields[number], (string | number | boolean | bigint)[] | null>>;
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
            key: "id",
            title: "ID",
            align: "left",
            width: 80
        },
        {
            dataIndex: "openid",
            key: "openid",
            title: "openid",
            align: "left",
            filters: [
                {
                    text: "存在 openid",
                    value: "true"
                },
                {
                    text: "不存在 openid",
                    value: "false"
                }
            ],
            ellipsis: true,
            width: 200,
            render: openid=>openid ? <div className="openid" style={{display: "flex", width: "100%", flexFlow: "row nowrap", gap: ".2rem"}}><Text copyable={{text: openid, tooltips: false}} /><div style={{maxWidth: "calc(100% - 15px - .2rem)"}}><div title={openid} style={{overflow: "hidden", textOverflow: "ellipsis"}}>{openid}</div></div></div> : "未迁移"
        },
        {
            dataIndex: "nickname",
            key: "nickname",
            title: "昵称",
            align: "left",
            ellipsis: true,
            render: nickname=><Tooltip title={nickname} placement="top">{nickname}</Tooltip>,
            width: 125
        },
        {
            dataIndex: "campus",
            key: "campus",
            title: "校区",
            align: "left",
            render: (campus, entry)=>entry.immed === "1" ? campus : "未迁移",
            width: 70
        },
        {
            dataIndex: "role",
            key: "role",
            title: "类型",
            align: "left",
            width: 75,
            filters: [
                {
                    text: "用户",
                    value: "user"
                },
                {
                    text: "技术员",
                    value: "technician"
                }
            ],
            render: role=>role === "admin" ? "管理员" : role === "technician" ? "技术员" : "用户"
        },
        {
            dataIndex: "phone",
            key: "phone",
            title: "手机号",
            //copyable: true
            align: "left",
            width: 170,
            render: (phone, entry)=><div className="phone" style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".25rem"}}>{entry.status === "verified" ? <Tooltip title="已验证"><CheckCircleFilled style={{color: "#136630", fontSize: "1.15rem"}} /></Tooltip> : <Tooltip title="未验证"><CloseCircleFilled style={{color: "#861a1a", fontSize: "1.15rem"}} /></Tooltip>}<Paragraph copyable={{tooltips: false}}>{phone}</Paragraph></div>,
        },
        {
            dataIndex: "email",
            key: "email",
            title: "邮件地址",
            align: "left"
        },
        {
            dataIndex: "token_expiry",
            key: "token_expiry",
            title: "活跃时间",
            align: "left",
            render: token_expiry=>{
                if(token_expiry !== "0000-00-00 00:00:00"){
                    const date = new Date(token_expiry);
                    date.setHours(date.getHours() - 1);
                    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${(date.getMinutes() + "").padStart(2, "0")}:${(date.getSeconds() + "").padStart(2, "0")}`;
                }
                else return "不活跃";
            }
        }
    ];
    constructor(props :Props){
        super(props);
        this.state = {
            loading: true,
            datas: [],
            currentPage: 1,
            dataSize: 0,
            pageSize: 0,
            filters: {}
        };
    }
    componentDidMount(){
        this.updateTable();
    }
    changePageSize = (currentPage :number, newSize :number)=>{
        localforage.setItem("users_pageSize", newSize).then(()=>this.updateTable());
    }
    pageChange = (page :number, pageSize :number)=>{
        this.setState({currentPage: page}, this.updateTable);
    }
    tableChange = (_pagination :TablePaginationConfig, filters :Record<typeof FilterableFields[number], (string | number | boolean | bigint)[] | null>, sorter :SorterResult<UserData> | SorterResult<UserData>[])=>{
        console.log(_pagination, filters, sorter);
        this.setState({filters}, this.updateTable);
    }
    updateTable = async ()=>{
        this.setState({loading: true}, async ()=>{
            this.getDataSize();
            const pageSize = await iniLocalforage("users_pageSize", 20);
            this.setState({pageSize}, ()=>{
                this.getData();
                this.setState({loading: false});
            });
        });
    }
    getDataSize = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/admin/getnum/user`);
        console.log(this.state.filters);
        if(Object.keys(this.state.filters).length !== 0) for(let i in this.state.filters){
            const I = i as typeof FilterableFields[number];
            if(this.state.filters[I] !== null && this.state.filters[I]!.length === 1){
                url.searchParams.append(i, this.state.filters[I]![0] as string);
            }
        }
        const data = (await this.fetchData<GetnumResponse>(url, "GET"))!;
        //console.log(data);
        if(data.success) this.setState({dataSize: data.total_users});
        //note:这个地方不知道怎么搞，可能出问题
        else this.setState({dataSize: 0});
    }
    getData = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/status/getUser`);
        url.searchParams.append("page", this.state.currentPage + "");
        url.searchParams.append("limit", this.state.pageSize + "");
        if(Object.keys(this.state.filters).length !== 0) for(let i in this.state.filters){
            const I = i as typeof FilterableFields[number];
            if(this.state.filters[I] !== null && this.state.filters[I]!.length === 1){
                url.searchParams.append(i, this.state.filters[I]![0] as string);
            }
        }
        const data = (await this.fetchData<GetUserResponse>(url, "GET"))!;
        if(data.error){
            this.props.ATFailCallBack();
            this.setState({datas: []});
        }
        //console.log(data);
        this.setState({datas: data.data});
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
                <Table<UserData>
                    columns={this.columns}
                    rowKey={record=>record.id}
                    loading={this.state.loading}
                    dataSource={this.state.datas}
                    pagination={false}
                    scroll={{y: window.innerHeight - getPx("14rem") - 43}}
                    onChange={this.tableChange}
                />
                <div style={{
                    display: "flex",
                    flexFlow: "column nowrap",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "4rem"
                }}>
                    <Pagination defaultCurrent={1} current={this.state.currentPage} total={this.state.dataSize} showSizeChanger onShowSizeChange={this.changePageSize} onChange={this.pageChange} pageSize={this.state.pageSize} pageSizeOptions={[5, 10, 20, 30, 40, 50, 75, 100, 200]} />
                </div>
            </div>
        );
    }
}