import React, { PureComponent as Pc } from "react";
import localforage from "localforage";
import styles from "./UserManage.module.css";
import mainStyles from "../css/main.module.css";
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, InputRef, Pagination, Popconfirm, Radio, Select, Slider, Table, Tooltip } from "antd";
import meta from "../meta";
import { anyObject } from "../main";
import Text from "antd/es/typography/Text";
import { getPx, iniLocalforage } from "../misc";
import { ColumnType, SorterResult, TablePaginationConfig } from "antd/es/table/interface";
import { GetUserNumResponse, GetUserResponse, UserData, UserDeleteResponse } from "../schema/user";
import { NoticeType } from "antd/es/message/interface";
import { URLLike } from "../schema/dedicatedTypes";

type Props = {
    ATFailCallBack :(message?: string)=>void;
    sendMessage :(content :string, type :NoticeType)=>void;
};

const
    //todo:展示技术员的available并支持筛选
    FilterableFields = ["campus", "role", "available", "openid", "immed"] as const,
    //所有role相关的属性都需要在role修改表单中一起提交
    EditableFields :(keyof UserData)[] = ["campus", "role", "email", "phone", "nickname"],
    EditRolePermittedValues = ["江安", "望江", "华西"],
    EditWantsMarks :Record<string | number, React.ReactNode> = {
        0: "暂停接单",
        25: "减少接单",
        50: "正常接单",
        75: "增多接单",
        100: "疯狂接单"
    };

function convertWants(input :UserData["wants"]){
    switch(input){
        case "a": return 0;
        case "b": return 25;
        case "c": return 50;
        case "d": return 75;
        case "e": return 100;
    }
}

function convertWantsB(input :number) :UserData["wants"] | undefined{
    switch(input){
        case 0: return "a";
        case 25: return "b";
        case 50: return "c";
        case 75: return "d";
        case 100: return "e";
    }
}

function convertAvailableB(input :number) :UserData["available"] | undefined{
    switch(input){
        case 0: return "0";
        case 20: return "1";
        case 40: return "2";
        case 60: return "3";
        case 80: return "4";
        case 100: return "5";
    }
}

type State = {
    loading :boolean;
    datas :UserData[];
    originDatas :UserData[];
    currentPage :number;
    dataSize :number;
    pageSize :number;
    filters :Partial<Record<typeof FilterableFields[number], (string | number | boolean | bigint)[] | null>>;
    editing :boolean;
    editorTop :number;
    editorLeft :number;
    editorVisible :boolean;
    editorKey :number;
    createOpened :boolean;
    createLoading :boolean;
    cachedInnerHeight :number;
};

/**@once */
export default class UserManage extends Pc<Props, State>{
    columns :ColumnType<UserData>[] = [
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
            defaultFilteredValue: [true],
            filteredValue: [true],
            ellipsis: true,
            width: 180,
            render: openid=>openid ?
                <div className={`openid ${styles.openid}`}>
                    <Text copyable={{text: openid, tooltips: false}} />
                    <div className={styles.openidInner}><div title={openid} className={styles.openidText}>{openid}</div></div>
                </div> : "未迁移"
        },
        {
            dataIndex: "nickname",
            key: "nickname",
            title: "昵称",
            align: "left",
            ellipsis: true,
            render: nickname=><Tooltip title={nickname} placement="top">{nickname}</Tooltip>,
            width: 125,
            //对，这里需要手动和 dataIndex 同步，这是我目前想出最好的获取字段名的方案了:)
            onCell: (data :UserData)=>{
                return {onDoubleClick: event=>this.startEdit(data, event, "nickname")};
            }
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
            filteredValue: [],
            align: "left",
            render: (campus, entry)=>entry.immed === "1" ? campus : "未迁移",
            width: 70,
            //对，这里需要手动和 dataIndex 同步，这是我目前想出最好的获取字段名的方案了:)
            onCell: (data :UserData)=>{
                if(data.campus as string !== "虚空") return {onDoubleClick: event=>this.startEdit(data, event, "campus")};
                else return {};
            }
        },
        {
            dataIndex: "role",
            key: "role",
            title: "类型",
            align: "left",
            width: 75,
            filters: [
                {
                    text: "管理员",
                    value: "admin"
                },
                {
                    text: "技术员",
                    value: "technician"
                },
                {
                    text: "用户",
                    value: "user"
                }
            ],
            filteredValue: [],
            render: role=>role === "admin" ? "管理员" : role === "technician" ? <Tooltip mouseEnterDelay={0.5} title="双击编辑接单意愿">技术员</Tooltip> : <Tooltip mouseEnterDelay={0.5} title="双击编辑报修余额">用户</Tooltip>,
            //对，这里需要手动和 dataIndex 同步，这是我目前想出最好的获取字段名的方案了:)
            onCell: (data :UserData)=>{
                if(data.role !== "admin") return {onDoubleClick: event=>this.startEdit(data, event, "role")};
                else return {};
            }
        },
        {
            dataIndex: "phone",
            key: "phone",
            title: "手机号",
            align: "left",
            width: 150,
            render: (phone, record)=>(
                <div className={`phone ${styles.phone}`}>
                    {record.immed === "0" ?
                        <Tooltip title="未迁移"><ExclamationCircleFilled className={styles.warning} /></Tooltip>
                    :record.status === "verified" ?
                        <Tooltip title="已验证"><CheckCircleFilled className={styles.success} /></Tooltip>
                    :   <Tooltip title="未验证"><CloseCircleFilled className={styles.error} /></Tooltip>
                    }
                    {phone}
                </div>
            ),
            //对，这里需要手动和 dataIndex 同步，这是我目前想出最好的获取字段名的方案了:)
            onCell: (data :UserData)=>{
                return {onDoubleClick: event=>this.startEdit(data, event, "phone")};
            }
        },
        {
            dataIndex: "email",
            key: "email",
            title: "邮件地址",
            align: "left",
            ellipsis: true,
            minWidth: 150,
            render: (email, record)=>(
                <div className={`email ${styles.phone}`}>
                    {record.immed === "0" ?
                        <Tooltip title="未迁移"><ExclamationCircleFilled className={styles.warning} /></Tooltip>
                    :record.status === "verified" ?
                        <Tooltip title="已验证"><CheckCircleFilled className={styles.success} /></Tooltip>
                    :   <Tooltip title="未验证"><CloseCircleFilled className={styles.error} /></Tooltip>
                    }
                    <div className={`openid ${styles.openid}`}>
                        <Text copyable={{text: email, tooltips: false}} />
                        <div className={styles.openidInner}><div title={email} className={styles.openidText}>{email}</div></div>
                    </div>
                </div>
            ),
            //对，这里需要手动和 dataIndex 同步，这是我目前想出最好的获取字段名的方案了:)
            onCell: (data :UserData)=>{
                return {onDoubleClick: event=>this.startEdit(data, event, "email")};
            }
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
            render: (_, record)=><Popconfirm title="确定要删除该用户吗？" okButtonProps={{autoInsertSpace: false}} okType="danger" cancelButtonProps={{autoInsertSpace: false}} onConfirm={()=>this.deleteUser(record)}><Button size="small" type="link" disabled={record.role === "admin"} >删除</Button></Popconfirm>
        }
    ];
    customFilter :string = "";
    observer :ResizeObserver | null = null;
    editorRef :React.RefObject<HTMLDivElement | null> = React.createRef<HTMLDivElement>();
    editorInputRef :React.RefObject<InputRef | null> = React.createRef<InputRef>();
    editMouseDownInside :boolean = false;
    editingRecord :UserData | null = null;
    editingValue :string | URLLike | "" = "";
    editRole :{
        isTechnician :boolean;
        available :UserData["available"];
        wants :UserData["wants"];
    } | null = null;
    editingField :typeof EditableFields[number] | null = null;
    constructor(props :Props){
        super(props);
        this.state = {
            loading: true,
            datas: [],
            originDatas: [],
            currentPage: 1,
            dataSize: 0,
            pageSize: 20,
            cachedInnerHeight: window.innerHeight,
            filters: {
                campus: null,
                role: null,
                openid: [true]
            },
            editing: false,
            editorKey: Date.now(),
            editorTop: 0,
            editorLeft: 0,
            editorVisible: false,
            createOpened: false,
            createLoading: false
        };
    }
    componentDidMount(){
        this.updateTable(true);
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
        localforage.setItem("users_pageSize", newSize).then(()=>{
            this.setState({pageSize: newSize}, ()=>this.updateTable(false));
        });
    }
    pageChange = (page :number, pageSize :number)=>{
        this.setState({currentPage: page}, ()=>this.updateTable(false));
    }
    tableChange = (_pagination :TablePaginationConfig, filters :Record<typeof FilterableFields[number], (string | number | boolean | bigint)[] | null>, sorter :SorterResult<UserData> | SorterResult<UserData>[])=>{
        console.log(_pagination, filters, sorter);
        this.columns[1].filteredValue = filters.openid;
        this.setState({filters}, ()=>this.updateTable(false));
    }
    updateTable = (isFirst :boolean)=>{
        console.log("updatetable");
        this.setState({loading: true}, async ()=>{
            await this.getDataSize();
            const pageSize = isFirst ? await iniLocalforage("users_pageSize", 20) : this.state.pageSize;
            console.log(this.state.filters, this.state.currentPage, Math.ceil(this.state.dataSize / pageSize));
            this.setState({
                pageSize,
                currentPage: Math.max(Math.min(this.state.currentPage, Math.ceil(this.state.dataSize / pageSize)), 1)
            }, ()=>this.getData().then(()=>this.setState({loading: false})));
        });
    }
    getDataSize = ()=>{
        return new Promise(async resolve=>{
            const url = new URL(`${meta.apiDomain}/v1/admin/getnum/user`);
            if(this.state.filters.openid && this.state.filters.openid.length !== 2){
                if(this.state.filters.openid.includes(true)) url.searchParams.append("immed", "1");
                else url.searchParams.append("immed", "0");
            }
            this.appendFilters(url);
            const data = await this.fetchData<GetUserNumResponse>(url, "GET");
            if(data){
                console.log(data.total_users);
                if(data.success) this.setState({dataSize: data.total_users}, ()=>resolve(undefined));
                //note:这个地方不知道怎么搞，可能出问题
                else this.setState({dataSize: 0}, ()=>resolve(undefined));
            }
            else this.props.ATFailCallBack("获取数量数据失败");
        });
    }
    getData = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/status/getUser`);
        url.searchParams.append("page", this.state.currentPage + "");
        url.searchParams.append("limit", this.state.pageSize + "");
        console.log(this.state.filters, this.state.filters.openid);
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
                if(I === "immed" || I === "available" || I === "campus" || I === "regtime" || I === "avatar" || I === "email_status" || I === "status" || I === "role" || I === "token_expiry" || I === "wants" || value[I] === null) continue;
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
        if(response && response.success){
            this.props.sendMessage(response.message, "success");
            this.updateTable(false);
        }
        else this.props.sendMessage("出现错误，请刷新重试", "error");
    }
    createUser = async ()=>{
        this.setState({createLoading: true});
        //todo
        setTimeout(()=>{
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
    startEdit = (data :UserData, event :React.MouseEvent<any>, field :typeof EditableFields[number])=>{
        //console.log(data, event, data[field]);
        let element = event.target as HTMLElement;
        while(element.tagName !== "TD" && element.parentElement) element = element.parentElement;
        if(element.tagName === "TD"){
            const {top, left, height, width} = element.getBoundingClientRect();
            document.addEventListener("mousedown", this.editCancelMouseDownCB);
            document.addEventListener("mouseup", this.editCancelMouseUpCB);
            //`keypress` 居然是弃用的
            document.addEventListener("keydown", this.editCancelKeyCB);
            this.editingRecord = data;
            this.editingValue = data[field];
            this.editingField = field;
            this.editRole = {
                isTechnician: data.role === "technician",
                available: data.available,
                wants: data.wants
            };
            console.log(data);
            this.setState({
                editing: true
            }, ()=>{
                const {height: eHeight, width: eWidth} = this.editorRef.current!.getBoundingClientRect();
                this.setState({
                    editorVisible: true,
                    editorTop: top + (height - eHeight) / 2,
                    editorLeft: left + (width - eWidth) / 2,
                });
                //后处理
                switch(this.editingField){
                    case "campus":
                        break;
                    case "role":
                        break;
                    default:
                        setTimeout(()=>this.editorInputRef.current!.focus({cursor: "all"}), 0);
                        break;
                }
            });
        }
    }
    editCancelMouseDownCB = (event :MouseEvent)=>this.editCancelCB(event.target as HTMLElement)
    editCancelCB = (element :HTMLElement)=>{
        while(element !== this.editorRef.current! && !element.classList.contains("ant-select-dropdown") && !element.classList.contains("ant-tooltip") && element.tagName !== "BODY" && element.parentElement) element = element.parentElement;
        this.editMouseDownInside = element.tagName !== "BODY";
    }
    editCancelMouseUpCB = (event :MouseEvent)=>{
        if(!this.editMouseDownInside){
            let element = event.target as HTMLElement;
            while(element !== this.editorRef.current! && !element.classList.contains("ant-select-dropdown") && !element.classList.contains("ant-tooltip") && element.tagName !== "BODY" && element.parentElement) element = element.parentElement;
            if(element.tagName === "BODY") this.endEdit(true);
        }
    }
    editCancelKeyCB = (event :KeyboardEvent)=>{
        if(event.key === "Enter") this.endEdit(false);
        else if(event.key === "Escape") this.endEdit(true);
    }
    endEdit = async (cancel :boolean)=>{
        document.removeEventListener("mousedown", this.editCancelMouseDownCB);
        document.removeEventListener("mouseup", this.editCancelMouseUpCB);
        document.removeEventListener("keydown", this.editCancelKeyCB);
        if(!cancel){
            //console.log("save", this.editingField, this.editingValue, this.editingRecord);
            if(this.editingField === "role"){
                this.editingRecord!["available"] = this.editRole!.available;
                this.editingRecord!["wants"] = this.editRole!.wants;
                this.editingRecord!["role"] = this.editingValue as UserData["role"];
            }
            //因为有URLLike自定义属性，这个东西变成了never。
            (this.editingRecord![this.editingField!] as any) = this.editingValue as any;
            console.log(this.editingRecord);
            const response = await this.fetchData<{success :boolean; changedFields :Partial<UserData>}>(`${meta.apiDomain}/v1/user/setuser`, "POST", {}, {
                ...this.editingRecord!,
                //fixme:这个东西能让整个系统寿命减少至少一年！
                uid: this.editingRecord!.id
            });
            if(response && response.success){
                console.log(response);
                this.updateTable(false);
            }
            else this.props.sendMessage("编辑失败，请刷新重试", "error");
        }
        if(this.editingField === "role") this.editRole = null;
        this.editingRecord = null;
        this.editingValue = "";
        this.editingField = null;
        this.editRole = null;
        this.setState({
            editing: false,
            editorVisible: false
        });
    }
    render() :React.ReactNode{
        return(<div id="users" className={mainStyles.app}>
            <div className={styles.search}>
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
            <div className={styles.pagination}>
                <Pagination defaultCurrent={1} current={this.state.currentPage} total={this.state.dataSize} showSizeChanger onShowSizeChange={this.changePageSize} onChange={this.pageChange} pageSize={this.state.pageSize} pageSizeOptions={[5, 10, 20, 30, 40, 50, 75, 100, 200]} />
            </div>
            <div ref={this.editorRef} className={`${mainStyles.noselect} ${styles.panel}`} style={{
                visibility: this.state.editorVisible ? "visible" : "hidden",
                border: this.editingField === "role" ? "solid .125rem #5e87c9" : "",
                top: this.state.editorTop,
                left: this.state.editorLeft
            }}>{this.state.editing ?
                this.editingField === "campus" ?
                <Select
                    className={styles.campusSelect}
                    defaultValue={EditRolePermittedValues.includes(this.editingValue as unknown as string) ? this.editingValue : ""}
                    onChange={data=>this.editingValue = data}
                >
                    <Select.Option key="江安">江安</Select.Option>
                    <Select.Option key="望江">望江</Select.Option>
                    <Select.Option key="华西">华西</Select.Option>
                </Select>
                : this.editingField === "role" ?
                <div className={styles.editRole}>
                    <Radio.Group
                        defaultValue={this.editingValue}
                        onChange={event=>{
                            const changed = this.editingValue !== event.target.value;
                            this.editRole = {
                                available: changed ? event.target.value === "technician" ? "1" : event.target.value === "user" ? "5" : this.editRole!.available : this.editRole!.available,
                                wants: this.editRole!.wants,
                                isTechnician: event.target.value === "technician"
                            };
                            this.editingValue = event.target.value;
                            this.setState({editorKey: this.state.editorKey + 1});
                        }}
                        options={[
                            {
                                label: "技术员",
                                value: "technician"
                            },
                            {
                                label: "用户",
                                value: "user"
                            }
                        ]}
                        optionType="button"
                    />
                    {this.editRole!.isTechnician ? <>
                        <label className={styles.available}>
                            <Checkbox
                                title="是否可用"
                                defaultChecked={this.editRole!.available === "1"}
                                onChange={event=>{
                                    console.log(event);
                                    this.editRole!.available = event.target.checked ? "1" : "0";
                                }}
                            />可用
                            <div className={styles.tipWrapper}>
                                <span>原则上</span>
                                <span>不修改</span>
                            </div>
                        </label>
                        <label>接单意愿
                            <Slider
                                onChange={data=>{
                                    this.editRole = {
                                        ...this.editRole!,
                                        wants: convertWantsB(data)!
                                    };
                                }}
                                onFocus={event=>this.editCancelCB(event.target)}
                                defaultValue={convertWants(this.editRole!.wants)}
                                disabled={!this.editRole!.isTechnician}
                                step={null}
                                marks={{0:"a",25:"b",50:"c",75:"d",100:"e"}}
                                tooltip={{formatter: value=>EditWantsMarks[value ?? 0]}}
                            />
                        </label></> : <label>报修余额
                            <Slider
                                onChange={data=>{
                                    this.editRole = {
                                        ...this.editRole!,
                                        available: convertAvailableB(data)!
                                    };
                                }}
                                defaultValue={parseInt(this.editRole!.available) * 20}
                                step={20}
                                tooltip={{formatter: value=>(value ?? 0) / 20}}
                            />
                        </label>
                    }
                </div>
                :<Input
                    style={{width: this.editingField === "email" ? "14rem" : this.editingField === "nickname" ? "7rem" : "10rem"}}
                    ref={this.editorInputRef}
                    placeholder="输入值..."
                    onChange={event=>this.editingValue = event.target.value}
                    defaultValue={this.editingValue as unknown as string} />
            : null}</div>
        </div>);
    }
}