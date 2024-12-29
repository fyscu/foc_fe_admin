import React, { Component as Cp } from "react";
import styles from "./Statistics.module.css";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import { GetSummaryResponse } from "../schema/summary";
import { anyObject } from "../main";
import meta from "../meta";
import EChartsReact from "echarts-for-react";
import CountUp from "react-countup";
import { Col, Row, Statistic, StatisticProps } from "antd";

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {
    historyData :GetSummaryResponse | null;
};

const formatter :StatisticProps["formatter"] = value=><CountUp end={value as number} separator="," />;

/**@once */
export default class Statistics extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
        this.state = {
            historyData: null
        };
    }
    async componentDidMount(){
        const response = await this.fetchData<{success :boolean, data :GetSummaryResponse}>(`${meta.apiDomain}/v1/admin/getSummary`, "GET");
        if(response && response.success){
            this.setState({historyData: response.data});
            console.log(response.data);
        }
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
        const date = new Date(), today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        return(<div id="stats" className={mainStyles.app}>
            <div className={styles.upper}>
                <EChartsReact style={{
                    width: "500px",
                    height: "400px"
                }} option={{
                    title: {
                        text: "工单历史",
                        textAlign: "center",
                        textVerticalAlign: "middle",
                        left: 250,
                        top: 30,
                        textStyle: {color: "#cccccc"}
                    },
                    textStyle: {color: "#cccccc"},
                    tooltip: {
                        trigger: "axis",
                        backgroundColor: "#101010dd",
                        textStyle: {color: "#cccccc"}
                    },
                    xAxis: {
                        type: "category",
                        data: this.state.historyData ? [...this.state.historyData.recentTickets.map(value=>value.date as unknown as string), today] : undefined
                    },
                    yAxis: {
                        type: "value",
                        splitLine: {lineStyle: {width: 0.2}}
                    },
                    series: [{
                        name: "工单数量",
                        type: "line",
                        data: this.state.historyData ? [...this.state.historyData.recentTickets.map(value=>value.count), this.state.historyData.thisDayTickets] : undefined
                    }]
                }} />
                <div>
                    <Row gutter={12}>
                        <Col>
                            <Statistic formatter={formatter} value={this.state.historyData?.thisDayTickets ?? 0} title="今日工单" />
                            <Statistic formatter={formatter} value={this.state.historyData?.totalUser ?? 0} title="用户总数" />
                        </Col>
                        <Col>
                            <Statistic formatter={formatter} value={this.state.historyData?.thisMonthTickets ?? 0} title="本月工单" />
                            <Statistic formatter={formatter} value={this.state.historyData?.totalTech ?? 0} title="技术员总数" />
                        </Col>
                        <Col>
                            <Statistic formatter={formatter} value={this.state.historyData?.thisYearTickets ?? 0} title="本年工单" />
                            <Statistic formatter={formatter} value={this.state.historyData?.totalFeedback ?? 0} title="反馈总数" />
                        </Col>
                        <Col><Statistic formatter={formatter} value={this.state.historyData?.totalTickets ?? 0} title="工单总数" /></Col>
                    </Row>
                </div>
            </div>
            <div className={styles.lower}>
                <div>
                    新注册用户
                </div>
                <div>
                    近期活动
                </div>
            </div>
        </div>);
    }
}