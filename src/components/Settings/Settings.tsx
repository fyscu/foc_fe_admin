import React, { Component as Cp } from "react";
import mainStyles from "../css/main.module.css";
import localforage from "localforage";
import styles from "./Settings.module.css";
import { Select, Switch } from "antd";

type Props = {

};

type State = {

};

/**@once */
export default class Settings extends Cp<Props, State>{
    render() :React.ReactNode{
        return(
            <div id="settings" style={{
                display: "flex",
                flexFlow: "column nowrap",
                width: "calc(100dvw - 10rem)",
                padding: "3rem 3rem 0"
            }}>
                <div style={{

                }}>

                </div>
            </div>
        );
    }
}