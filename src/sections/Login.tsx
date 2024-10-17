import { useEffect, useRef, useState } from "react";
import { LoginForm, ProFormCheckbox, ProFormInstance, ProFormText } from "@ant-design/pro-components";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, message, Modal } from "antd";
import localforage from "localforage";
import meta from "../meta";
import { login, LoginFormData, LoginResponse } from "../schema/login";

type Props = {
    succeedCallBack :(responseData :LoginResponse)=>void;
};

/**@once */
export default function Login(props :Props){
    const
        ref = useRef<ProFormInstance<LoginFormData> | undefined>(),
        [aboutModalOpened, setAboutModalOpened] = useState(false),
        [messageAPI, contextHolder] = message.useMessage(),
        finish = (values :LoginFormData)=>{
            login(values.username, values.password).catch((reason :any)=>{
                messageAPI.open({
                    type: "error",
                    content: "请求失败"
                });
            }).then(async (value :Response | void)=>{
                if(value){
                    const response :LoginResponse = await value.json();
                    if(response.success){
                        props.succeedCallBack(response);
                        if(values.remember){
                            localforage.setItem("username", values.username);
                            localforage.setItem("password", values.password);
                        }
                        else{
                            localforage.removeItem("username");
                            localforage.removeItem("password");
                        }
                    }
                    else{
                        messageAPI.open({
                            type: "warning",
                            content: "使用保存的账户信息登录失败，请检查！"
                        });
                        messageAPI.open({
                            type: "error",
                            content: response.message
                        });
                    }
                }
            });
        };
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
    return(
        <div>
            {contextHolder}
            <ConfigProvider theme={{token: {fontSize: 14}}}>
                <LoginForm
                    formRef={ref} onFinish={finish} subTitle="飞扬俱乐部线上管理系统后台"
                    title={
                        <div>
                            <ConfigProvider theme={{components: {Button: {paddingInline: 0, textHoverBg: "transparent", colorBgTextActive: "transparent"}}}}><Button type="text" style={{fontSize: "2.3rem", fontWeight: "bold", userSelect: "text"}} onDoubleClick={()=>setAboutModalOpened(true)}>云上飞扬</Button></ConfigProvider>
                            <Modal
                                open={aboutModalOpened}
                                footer={null}
                                onCancel={()=>setAboutModalOpened(false)}
                                width={"60dvw"}
                                closable={false}
                            >{meta.about}</Modal>
                        </div>
                    }
                >
                    <ProFormText rules={[{required: true, message: "请输入用户名！"}]} name="username" placeholder="用户名" fieldProps={{
                        size: "large",
                        prefix: <UserOutlined />
                    }} />
                    <ProFormText.Password rules={[{required: true, message: "请输入密码！"}]} name="password" placeholder="密码" fieldProps={{
                        size: "large",
                        prefix: <LockOutlined />
                    }} />
                    <div style={{color: "var(--c-grey-2)"}}>若在公共计算机上进行操作，请不要勾选自动登录，并于退出前在设置页面退出账号！</div>
                    <ProFormCheckbox name="remember" valuePropName="checked">以后自动登录</ProFormCheckbox>
                </LoginForm>
            </ConfigProvider>
        </div>
    );
}