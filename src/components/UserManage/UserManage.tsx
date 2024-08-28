import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";

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
    render() :React.ReactNode{
        return(
            <div>users</div>
        );
    }
}