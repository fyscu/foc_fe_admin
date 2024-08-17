import React, { Component as Cp, Suspense } from "react";
import styles from "./App.module.css";
import mainStyles from "../css/main.module.css";
import Login from "./Login/Login";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

type State = {
    
};

/**@once */
export default class App extends Cp<{}, State>{
    constructor(props :{}){
        super(props);
    }
    //async checkLogin(){
    //    const AT = localStorage.getItem("access_token");
    //    const result = JSON.parse(new TextDecoder().decode((await (await fetch("https://fyapi2.wjlo.cc/v1/admin/getopenids", {
    //        method: "GET",
    //        headers: {
    //            "Content-Type": "application/json",
    //            "Authorization": `Bearer ${AT}`,
    //        }
    //    })).body?.getReader().read())?.value));
    //    console.log(result);
    //}
    render() :React.ReactNode{
        //this.checkLogin();
        console.log("???");
        return(
            <div className={mainStyles.fullScreen}>
                <Login />
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </div>
        );
    }
}