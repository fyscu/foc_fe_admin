import { useEffect, useRef } from "react";
import { LoginForm, ProFormCheckbox, ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import config from "../config";
import { message } from "antd";
import localforage from "localforage";

type Props = {
    succeedCallBack :(accessToken :string)=>void;
};

type formData = {
    username :string;
    password :string;
    remember :boolean;
};

type LoginResponse = {
    success :boolean;
    access_token :string;
    message :string;
    user :Record<string, any>;
};

/**@once */
export default function Login(props :Props){
    const ref = useRef<ProFormInstance<formData> | undefined>();
    useEffect(()=>{
        (async ()=>{
            const
                username = await localforage.getItem<string>("username"),
                password = await localforage.getItem<string>("password");
            if(username && password){
                ref.current?.setFieldValue("username", username);
                ref.current?.setFieldValue("password", password);
                ref.current?.setFieldValue("remember", true);
            }
        })();
    });
    const [messageAPI, contextHolder] = message.useMessage(), finish = async (values :formData)=>{
        const response :LoginResponse = await (await fetch(`${config.api}/v1/admin/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(values)
        })).json();
        if(response.success){
            props.succeedCallBack(response.access_token);
            if(values.remember){
                localforage.setItem("username", values.username);
                localforage.setItem("password", values.password);
            }
            else{
                localforage.removeItem("username");
                localforage.removeItem("password");
            }
            console.log(response);
        }
        else messageAPI.open({
            type: "error",
            content: response.message
        });
    }
    return(
        <div>
            {contextHolder}
            <LoginForm logo="" formRef={ref} onFinish={finish} title="云上飞扬" subTitle="飞扬俱乐部线上管理系统后台">
                <ProFormText rules={[{required: true, message: "请输入用户名！"}]} name="username" placeholder="用户名" fieldProps={{
                    size: "large",
                    prefix: <UserOutlined />
                }} />
                <ProFormText.Password rules={[{required: true, message: "请输入密码！"}]} name="password" placeholder="密码" fieldProps={{
                    size: "large",
                    prefix: <LockOutlined />
                }} />
                <ProFormCheckbox name="remember" valuePropName="checked">记住账户信息</ProFormCheckbox>
            </LoginForm>
        </div>
    );
}