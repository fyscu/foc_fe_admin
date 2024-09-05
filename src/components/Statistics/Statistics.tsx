import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";

type Props = {
    ATFailCallBack :()=>void;
};

type State = {

};

/**@once */
export default class Statistics extends Cp<Props, State>{
    constructor(props :Props){
        super(props);
    }
    componentDidMount(){
        
    }
    render() :React.ReactNode{
        return(
            <div>这个得等一会儿才会开发 :)</div>
        );
    }
}