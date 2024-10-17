import React, { Component as Cp } from "react";
import styles from "./Lucky.module.css";
import mainStyles from "../../css/main.module.css";
import localforage from "localforage";
import { ConfigProvider, Table, theme, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { anyObject } from "../../main";
import meta from "../../meta";
import { EventData, GetEventResponse } from "../../schema/event";

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {
    datas :EventData[];
    loading :boolean;
};

/**@once */
export default class Lucky extends Cp<Props, State>{
    columns :ColumnsType<EventData> = [
        {
            dataIndex: "id",
            key: "id",
            title: "活动ID",
            width: 80
        },
        {
            dataIndex: "name",
            key: "name",
            title: "活动名称",
            render: (value :string, record)=><Tooltip title={record.description}>{value}</Tooltip>
        },
        {
            dataIndex: "type",
            title: "活动类型",
            width: 80
        },
        {
            title: "进行状态",
            render: (value :undefined, record :EventData)=>Date.now() >= new Date(record.start_time).getTime() ? Date.now() < new Date(record.end_time).getTime() ? <span style={{color: "var(--c-success)"}}>进行中</span> : <span color="var(--c-danger)">已结束</span> : <span style={{color: "var(--c-active)"}}>未开始</span>,
            width: 80
        }
    ];
    constructor(props :Props){
        super(props);
        this.state = {
            datas: [],
            loading: true
        };
    }
    componentDidMount(){
        this.updateTable();
    }
    updateTable = async ()=>{
        this.setState({loading: true}, ()=>{
            this.getData().then(()=>{
                this.setState({loading: false});
            });
        });
    }
    getData = async ()=>{
        const url = new URL(`${meta.apiDomain}/v1/status/getEvent?isLucky=1`);
        const data = (await this.fetchData<GetEventResponse>(url, "GET"));
        if(!data || !data.success)this.setState({datas: []});
        else this.setState({datas: data.activities as EventData[]});
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
    render() :React.ReactNode{
        return(
            <div id="lottery" className={styles.main}>
                <ConfigProvider theme={{
                    algorithm: theme.defaultAlgorithm,
                    token: {
                        colorBgContainer: "#f0fff0"
                    }
                }}>
                    <Table<EventData>
                        columns={this.columns}
                        rowKey={record=>record.id}
                        loading={this.state.loading}
                        dataSource={this.state.datas}
                        pagination={false}
                    />
                </ConfigProvider>
            </div>
        );
    }
}