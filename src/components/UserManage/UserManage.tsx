import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import config from "../../config";
import { Table } from "antd";

type Props = {
    ATFailCallBack :()=>void;
};

type State = {

};

/**@once */
export default class UserManage extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
    }
    componentDidMount(){
        
    }
    getData = async ()=>{
        const AT = await localforage.getItem("access_token");
        if(AT === null){
            this.props.ATFailCallBack();
            return {success: false};
        }
        const r = fetch(`${config.api}/v1/status/getUser`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AT}`
            }
        });
        console.log((await r).json());
        return {

        };
    }
    render() :React.ReactNode{
        return(
            <Table />
        );
    }
}