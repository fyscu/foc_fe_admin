import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {

};

/**@once */
export default class OrderManage extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
    }
    componentDidMount(){
        
    }
    render() :React.ReactNode{
        return(
            <div>工单管理</div>
        );
    }
}