import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";

type Props = {
    ATFailCallBack :(message?: string)=>void;
};

type State = {

};

/**@once */
export default class EventManage extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
    }
    componentDidMount(){
        
    }
    render() :React.ReactNode{
        return(<div id="events" className={mainStyles.app}>
            <div>events</div>
        </div>);
    }
}