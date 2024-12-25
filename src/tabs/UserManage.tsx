import React, { Component as Cp } from "react";
import localforage from "localforage";
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Pagination, Popconfirm, Table, Tooltip } from "antd";
import meta from "../meta";
import { anyObject } from "../main";
import Paragraph from "antd/es/typography/Paragraph";
import Text from "antd/es/typography/Text";
import { getPx, iniLocalforage } from "../misc";
import { ColumnGroupType, ColumnType, SorterResult, TablePaginationConfig } from "antd/es/table/interface";
import { GetUserNumResponse, GetUserResponse, UserData, UserDeleteResponse } from "../schema/user";
import { NoticeType } from "antd/es/message/interface";

type Props = {
    ATFailCallBack :(message?: string)=>void;
    sendMessage :(content :string, type :NoticeType)=>void;
};

const FilterableFields = ["campus", "role", "available", "uid", "openid", "phone", "email", "immed"] as const;

type EditableCellProps = {
    title :React.ReactNode;
    editable :boolean;
    dataIndex :keyof UserData;
    record :UserData;
    handleSave: (record :UserData)=>void;
};

type State = {
    loading :boolean;
    datas :UserData[];
    originDatas :UserData[];
    currentPage :number;
    dataSize :number;
    pageSize :number;
    filters :Partial<Record<typeof FilterableFields[number], (string | number | boolean | bigint)[] | null>>;
    editing :boolean;
    createOpened :boolean;
    createLoading :boolean;
    cachedInnerHeight :number;
};

/**@once */
export default class UserManage extends Cp<Props, State>{
    columns :((ColumnGroupType<UserData> | ColumnType<UserData>) & {editable? :boolean;})[] = [
        {
            dataIndex: "id",
            key: "id",
            title: "用户ID",
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
                    value: true
                },
                {
                    text: "不存在 openid",
                    value: false
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
            filters: [
                {
                    text: "江安",
                    value: "江安"
                },
                {
                    text: "望江",
                    value: "望江"
                },
                {
                    text: "华西",
                    value: "华西"
                }
            ],
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
            editable: true,
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
            align: "left",
            width: 170,
            render: (phone, record)=>(
                <div className="phone" style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".25rem"}}>
                    {record.immed === "0" ?
                        <Tooltip title="未迁移">
                            <ExclamationCircleFilled style={{color: "#aa9914", fontSize: "1.15rem"}} />
                        </Tooltip>
                        :
                    record.status === "verified" ?
                        <Tooltip title="已验证">
                            <CheckCircleFilled style={{color: "#136630", fontSize: "1.15rem"}} />
                        </Tooltip>
                    :   <Tooltip title="未验证">
                            <CloseCircleFilled style={{color: "#861a1a", fontSize: "1.15rem"}} />
                        </Tooltip>
                    }
                    <Paragraph copyable={{tooltips: false}}>{phone}</Paragraph>
                </div>
            )
        },
        {
            dataIndex: "email",
            key: "email",
            title: "邮件地址",
            align: "left",
            ellipsis: true,
            minWidth: 150,
            render: (phone, record)=>(
                <div className="email" style={{display: "flex", flexFlow: "row nowrap", alignItems: "center", gap: ".25rem"}}>
                    {record.immed === "0" ?
                        <Tooltip title="未迁移">
                            <ExclamationCircleFilled style={{color: "#aa9914", fontSize: "1.15rem"}} />
                        </Tooltip>
                        :
                    record.status === "verified" ?
                        <Tooltip title="已验证">
                            <CheckCircleFilled style={{color: "#136630", fontSize: "1.15rem"}} />
                        </Tooltip>
                    :   <Tooltip title="未验证">
                            <CloseCircleFilled style={{color: "#861a1a", fontSize: "1.15rem"}} />
                        </Tooltip>
                    }
                    <Paragraph copyable={{tooltips: false}}>{phone}</Paragraph>
                </div>
            )
        },
        {
            dataIndex: "token_expiry",
            key: "token_expiry",
            title: "活跃时间",
            align: "left",
            ellipsis: true,
            render: token_expiry=>{
                if(token_expiry !== "0000-00-00 00:00:00"){
                    const date = new Date(token_expiry);
                    date.setHours(date.getHours() - 1);
                    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${(date.getMinutes() + "").padStart(2, "0")}:${(date.getSeconds() + "").padStart(2, "0")}`;
                }
                else return "不活跃";
            }
        },
        {
            title: "操作",
            key: "actions",
            width: 70,
            render: (_, record)=><Popconfirm title="确定要删除该用户吗？" okButtonProps={{autoInsertSpace: false}} okType="danger" cancelButtonProps={{autoInsertSpace: false}} onConfirm={()=>this.deleteUser(record)}><Button size="small" type="link" disabled={record.role == "admin"} >删除</Button></Popconfirm>
        }
    ];
    customFilter :string;
    observer :ResizeObserver | null = null;
    constructor(props :Props){
        super(props);
        this.state = {
            loading: true,
            datas: [],
            originDatas: [],
            currentPage: 1,
            dataSize: 0,
            pageSize: 0,
            cachedInnerHeight: window.innerHeight,
            filters: {},
            editing: false,
            createOpened: false,
            createLoading: false
        };
        this.customFilter = "";
    }
    componentDidMount(){
        this.updateTable();
        this.observer = new ResizeObserver(this.resizeCB);
        this.observer.observe(document.body);
    }
    componentWillUnmount(){
        this.observer!.unobserve(document.body);
        this.observer!.disconnect();
    }
    resizeCB = (entries :ResizeObserverEntry[])=>{
        this.setState({cachedInnerHeight: entries[0].contentRect.height});
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
    updateTable = ()=>{
        this.setState({loading: true}, async ()=>{
            await this.getDataSize();
            const pageSize = await iniLocalforage("users_pageSize", 20);
            this.setState({pageSize}, ()=>{
                this.getData().then(()=>this.setState({loading: false}));
            });
        });
    }
    getDataSize = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/admin/getnum/user`);
        if(this.state.filters.openid && this.state.filters.openid.length !== 2){
            if(this.state.filters.openid.includes(true)) url.searchParams.append("immed", "1");
            else url.searchParams.append("immed", "0");
        }
        this.appendFilters(url);
        const data = await this.fetchData<GetUserNumResponse>(url, "GET");
        if(data){
            console.log(data.total_users);
            if(data.success) this.setState({dataSize: data.total_users});
            //note:这个地方不知道怎么搞，可能出问题
            else this.setState({dataSize: 0});
        }
        else this.props.ATFailCallBack("获取数量数据失败");
    }
    getData = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/status/getUser`);
        url.searchParams.append("page", this.state.currentPage + "");
        url.searchParams.append("limit", this.state.pageSize + "");
        if(this.state.filters.openid && this.state.filters.openid.length !== 2){
            if(this.state.filters.openid.includes(true)) url.searchParams.append("immed", "1");
            else url.searchParams.append("immed", "0");
        }
        this.appendFilters(url);
        const data = (await this.fetchData<GetUserResponse>(url, "GET"))!;
        if(!data.success){
            this.props.ATFailCallBack("获取数据失败");
            this.setState({datas: []});
        }
        else this.setState({originDatas: data.data as UserData[]}, this.applyCustomFilter);
    }
    customChangeCB = (event :React.ChangeEvent<HTMLInputElement>)=>{
        this.customFilter = event.currentTarget.value;
        const cached = event.currentTarget.value;
        setTimeout(()=>{
            if(cached === this.customFilter) this.applyCustomFilter();
        }, 500);
    }
    applyCustomFilter = ()=>{
        this.setState({datas: this.state.originDatas.filter(value=>{
            for(const i in value){
                const I = i as keyof UserData;
                if(I === "avatar" || I === "email_status" || I === "status" || value[I] === null) continue;
                if((value[I] + "").includes(this.customFilter)) return true;
            }
            return false;
        })});
    }
    deleteUser = async (record :UserData)=>{
        const url = new URL(`${meta.apiDomain}/v1/user/delete`);
        const response = await this.fetchData<UserDeleteResponse>(url, "POST", {}, {
            openid: record.openid
        });
        if(response && response.success) this.props.sendMessage(response.message, "success");
        else this.props.sendMessage("出现错误，请刷新重试", "error");
    }
    createUser = async ()=>{
        this.setState({createLoading: true});
        //todo
        setTimeout(() => {
            this.setState({
                createLoading: false,
                createOpened: false
            });
        }, 1000);
        
    }
    private appendFilters(url :URL) :URL{
        if(Object.keys(this.state.filters).length !== 0) for(let i in this.state.filters){
            const I = i as typeof FilterableFields[number];
            if(
                (I !== "openid")
             && (this.state.filters[I] !== null && this.state.filters[I]!.length === 1)
            ) url.searchParams.append(i, this.state.filters[I]![0] as string);
        }
        return url;
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
        //网络出错或者登录过期，逻辑错误给调用的方法来处理
        response.catch((reason :any)=>{
            this.props.ATFailCallBack("出现未知错误，请检查控制台");
            console.log(reason);
        });
        return await (await response).json();
    }
    edit = ()=>{

    }
    render() :React.ReactNode{
        return(
            <div id="users" style={{
                display: "flex",
                flexFlow: "column nowrap",
                width: "calc(100dvw - 10rem)"
            }}>
                <div style={{
                    height: "2rem",
                    display: "flex",
                    flexFlow: "row nowrap",
                    gap: ".5rem",
                    padding: "1rem"
                }}>
                    <Input onChange={this.customChangeCB} prefix={<SearchOutlined />} placeholder="搜索本页内容..." />
                </div>
                <Table<UserData>
                    columns={this.columns}
                    rowKey={record=>record.id}
                    loading={this.state.loading}
                    dataSource={this.state.datas}
                    pagination={false}
                    scroll={{y: this.state.cachedInnerHeight - getPx("8rem") - 43}}
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