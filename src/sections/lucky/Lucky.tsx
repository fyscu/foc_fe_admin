import React, { Component as Cp, createRef } from "react";
import mainStyles from "../../css/main.module.css";
import styles from "./Lucky.module.css";
import localforage from "localforage";
import { Button, ConfigProvider, InputNumber, Modal, Table, theme, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { anyObject } from "../../main";
import meta from "../../meta";
import { EventData, GetEventResponse } from "../../schema/event";
import Settings from "../../tabs/Settings";
import { getLuckyResponse } from "../../schema/lottery";
import { toUrl, URLLike } from "../../schema/dedicatedTypes";
import { FullscreenExitOutlined, FullscreenOutlined, GiftOutlined, RollbackOutlined, SettingOutlined } from "@ant-design/icons";
import { randomInt } from "../../utils/misc";
import { GetUserResponse, UserData } from "../../schema/user";
import confetti from "canvas-confetti";
import defaultAvatar from "../../schema/defaultAvatar";

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {
    datas :EventData[];
    loading :boolean;
    settingsOpened :boolean;
    roll :{
        inRollPage :boolean;
        isRolling :boolean;
        rollingEnded :boolean;
        rollingId :string;
        rollingItem :string;
        count :number;
        current :string;
        inputStatus :"" | "error";
        fullScreened :boolean;
        max :number;
        result :{
            id :string;
            name :string;
            avatar :URLLike;
            number :string;
        }[];
    };
};

function resolveWinnum(input :string | null) :string[][]{
    if(input === null) return [];
    else{
        const temp = input.substring(2, input.length - 2).split("],["), result = [];
        for(let i = 0; i < temp.length; i++) result[i] = temp[i].split(",");
        return result;
    }
}

/**@once */
export default class Lucky extends Cp<Props, State>{
    columns :ColumnsType<EventData> = [
        {
            dataIndex: "id",
            key: "id",
            title: "活动 ID",
            width: 70
        },
        {
            dataIndex: "type",
            title: "活动类型",
            width: 80
        },
        {
            dataIndex: "name",
            key: "name",
            title: "活动名称"
        },
        {
            dataIndex: "description",
            key: "description",
            title: "活动描述"
        },
        {
            title: "进行状态",
            key: "status",
            render: (value :undefined, record :EventData)=>Date.now() >= new Date(record.start_time).getTime() ? Date.now() < new Date(record.end_time).getTime() ? <strong style={{color: "var(--c-success)"}}>进行中</strong> : <strong color="var(--c-danger)">已结束</strong> : <strong style={{color: "var(--c-active)"}}>未开始</strong>,
            width: 80
        },
        {
            title: "已抽取次数",
            key: "rolled_times",
            //已经在获取数据的时候指定isLucky=1，必有winnum
            render: (value :undefined, record :EventData)=>resolveWinnum(record.winnum).length,
            width: 100
        },
        {
            title: "抽取幸运观众",
            key: "roll",
            render: (value :undefined, record :EventData)=><Button type="link" autoInsertSpace={false} onClick={async ()=>{
                const data = await this.fetchData<GetEventResponse>(`${meta.apiDomain}/v1/status/getEvent?id=${record.id}`, "GET");
                this.setState(state=>({...state, roll: {... state.roll, inRollPage: true, rollingId: record.id, max: parseInt(data!.activities[0].max_luckynum)}}));
            }}>抽奖</Button>,
            width: 120
        }
    ];
    constructor(props :Props){
        super(props);
        this.state = {
            datas: [],
            loading: true,
            settingsOpened: false,
            roll: {
                inRollPage: false,
                isRolling: false,
                rollingId: "",
                fullScreened: false,
                rollingItem: "点击输入奖项",
                current: "?",
                count: 1,
                rollingEnded: false,
                inputStatus: "",
                result: [],
                max: 99
            }
        };
    }
    componentDidMount(){
        this.updateTable();
    }
    updateTable = async ()=>{
        this.setState({loading: true}, ()=>this.getData().then(()=>this.setState({loading: false})));
    }
    getData = async ()=>{
        const data = await this.fetchData<GetEventResponse>(`${meta.apiDomain}/v1/status/getEvent?isLucky=1`, "GET");
        if(!data || !data.success) this.setState({datas: []});
        else this.setState({datas: data.activities as EventData[]});
    }
    fullScreen = ()=>{
        if(this.state.roll.fullScreened){
            document.exitFullscreen();
            this.setState({...this.state, roll: {...this.state.roll, fullScreened: false}});
        }
        else{
            document.body.requestFullscreen();
            this.setState({...this.state, roll: {...this.state.roll, fullScreened: true}});
        }
    }
    resetRoll = ()=>{
        if(document.fullscreenElement) document.exitFullscreen();
        this.setState(state=>{
            return {
                ...state,
                roll: {
                    inRollPage: false,
                    isRolling: false,
                    result: [],
                    rollingId: "",
                    current: "?",
                    fullScreened: false,
                    count: 1,
                    inputStatus: "",
                    rollingEnded: false,
                    rollingItem: "点击输入奖项",
                    max: 99
                }
            };
        });
        this.updateTable();
    }
    roll = async ()=>{
        this.setState({
            ...this.state,
            roll: {
                ...this.state.roll,
                isRolling: true,
                rollingEnded: false,
                result: []
            }
        }, async ()=>{
            const
                delay = randomInt(6, 10) * 1000,
                data = await this.fetchData<getLuckyResponse>(`${meta.apiDomain}/v1/admin/getLuckyResult?activity_id=${this.state.roll.rollingId}&count=${this.state.roll.count}`, "GET");
            if(!data || !data.success) this.props.ATFailCallBack("获取抽奖结果失败");
            else{
                const id = setInterval(()=>this.setState({...this.state, roll: {...this.state.roll, current: randomInt(1, parseInt(data.max_luckynum)) + ""}}), 150);
                for(let i = 0; i < data.winning_user_ids.length; i++){
                    const response = await this.fetchData<GetUserResponse>(`${meta.apiDomain}/v1/status/getUser?uid=${data.winning_user_ids[i]}`, "GET");
                    if(!response || !response.success) this.props.ATFailCallBack("获取抽奖结果失败");
                    else{
                        const userData = response?.data as UserData;
                        this.setState(state=>{
                            return {
                                ...state,
                                roll: {
                                    ...state.roll,
                                    result: [...state.roll.result, {
                                        id: userData.id + "",
                                        name: userData.nickname,
                                        avatar: toUrl(userData.avatar) === "https://img1.doubanio.com/view/group_topic/l/public/p560183288.webp" ? defaultAvatar : userData.avatar,
                                        number: data.winning_nums[i]
                                    }]
                                }
                            };
                        });
                    }
                }
                setTimeout(()=>{
                    clearInterval(id);
                    console.log(this.state.roll.result);
                    this.setState({...this.state, roll: {...this.state.roll, isRolling: false, rollingEnded: true, current: data.winning_nums[0]}});
                    confetti({
                        particleCount: this.state.roll.fullScreened ? 500 : 350,
                        spread: 160,
                        decay: this.state.roll.fullScreened ? 0.91 : 0.9,
                        gravity: 1.1,
                        startVelocity: this.state.roll.fullScreened ? 60 : 45,
                        origin: {
                            x: 0.5,
                            y: 0.5
                        }
                    });
                }, delay);
            }
        });
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
        let rollingEvent = null;
        if(this.state.roll.rollingId !== "") for(let i = 0; i < this.state.datas.length; i++) if(this.state.datas[i].id === this.state.roll.rollingId) rollingEvent = this.state.datas[i];
        return(
            <ConfigProvider theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    colorBgContainer: "#f0fff0"
                }
            }}><section></section><div id="lucky" className={styles.main} style={{
                overflowY: "auto"
            }}>{
                this.state.roll.inRollPage ?
                <ConfigProvider theme={{
                    token: {
                        fontSize: 24
                    }
                }}>
                    <div className={styles.roll}>
                        <div style={{
                            display: "flex",
                            flexFlow: "row nowrap",
                            justifyContent: "center",
                            marginTop: "3rem"
                        }}>
                            <Typography.Title level={3} editable={{
                                triggerType: ["text"],
                                onChange: value=>this.setState({roll: {...this.state.roll, rollingItem: value}})
                            }}>{this.state.roll.rollingItem}</Typography.Title>
                        </div>
                        <div style={{
                            display: "flex",
                            flexFlow: "row nowrap",
                            justifyContent: "center",
                            marginBottom: "1rem"
                        }}>
                            <label className={mainStyles.noselect} style={{
                                display: "flex",
                                flexFlow: "row nowrap",
                                alignItems: "center",
                                gap: "1rem",
                                fontSize: "24px"
                            }}>
                                中奖数量：
                                <InputNumber style={{width: "7rem"}} size="large" min={1} max={this.state.roll.max} defaultValue={this.state.roll.count} onChange={value=>this.setState({...this.state, roll: {...this.state.roll, count: value ?? 1, inputStatus: value ? "" : "error"}})} status={this.state.roll.inputStatus} placeholder="1" required suffix={"人"} />
                            </label>
                        </div>
                        <div style={{
                            display: "flex",
                            flexFlow: "row nowrap",
                            justifyContent: "center",
                            marginBottom: "1rem",
                            fontSize: "6.5rem"
                        }}>{this.state.roll.current}</div>
                        <div style={{
                            display: "flex",
                            flexFlow: "row nowrap",
                            gap: "1rem",
                            justifyContent: "center",
                            alignItems: "center"
                        }}><ConfigProvider theme={{
                            components: {
                                Button: {
                                    contentFontSize: 26,
                                    lineWidth: 2
                                }
                            }
                        }}>
                            <Button style={{height: "4.5rem", width: "12rem"}} type="dashed" onClick={this.fullScreen} icon={this.state.roll.fullScreened ? <FullscreenExitOutlined /> : <FullscreenOutlined />}>{this.state.roll.fullScreened ? "退出全屏" : "全屏"}</Button>
                            <Button style={{height: "6rem", width: "14rem", fontSize: "30px"}} type="primary" onClick={this.roll} icon={<GiftOutlined />} loading={this.state.roll.isRolling}>抽奖</Button>
                            <Button style={{height: "4.5rem", width: "12rem"}} type="default" onClick={this.resetRoll} icon={<RollbackOutlined />}>返回主页</Button>
                        </ConfigProvider></div>
                        {
                            this.state.roll.rollingEnded ?
                            <div style={{
                                display: "flex",
                                flexFlow: "column nowrap",
                                alignItems: "center",
                                padding: "1rem 0 8rem"
                            }}>
                                <h2>恭喜以下同学中奖：</h2>
                                <ul style={{
                                    display: "flex",
                                    flexFlow: "column nowrap",
                                    gap: "1rem"
                                }}>
                                    {this.state.roll.result.map((value :State["roll"]["result"][number], index :number)=>(
                                        <li key={index} style={{
                                            display: "flex",
                                            flexFlow: "row nowrap",
                                            alignItems: "center",
                                            gap: "2rem",
                                            fontSize: "1.8rem"
                                        }}>
                                            <div>{value.number} 号</div>
                                            <img src={toUrl(value.avatar)} width={48} />
                                            <div>{value.name}</div>
                                            <div>（{value.id}）</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            : null
                        }
                    </div>
                </ConfigProvider>
                :<>
                    <div style={{display: "flex", flexFlow: "row nowrap", justifyContent: "center"}}><h4>已启用抽奖的活动</h4></div>
                    <Table<EventData>
                        columns={this.columns}
                        rowKey={record=>record.id}
                        loading={this.state.loading}
                        dataSource={this.state.datas}
                        pagination={false}
                    />
                    <div>
                        <Button onClick={()=>this.setState({settingsOpened: true})} autoInsertSpace={false} icon={<SettingOutlined />}>系统设置</Button>
                    </div>
                    <Modal
                        open={this.state.settingsOpened}
                        footer={null}
                        onCancel={()=>this.setState({settingsOpened: false})}
                        width={"60dvw"}
                        closable={false}
                    ><Settings fromLucky={true} ATFailCallBack={this.props.ATFailCallBack} /></Modal>
                </>
            }</div></ConfigProvider>
        );
    }
}