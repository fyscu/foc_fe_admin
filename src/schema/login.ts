import localforage from "localforage";
import meta from "../meta";
import { GetUserResponse, UserData } from "./user";

export type LoginFormData = {
    username :string;
    password :string;
    remember :boolean;
};

//`POST /v1/admin/login`
export type LoginResponse = {
    success :boolean;
    access_token :string;
    message :string;
    type :"super" | "lucky";
    user :UserData;
};

export async function login(username :string, password :string) :Promise<Response>{
    return fetch(`${meta.apiDomain}/v1/admin/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });
}

type IsLoggedInResponse = {
    success :boolean;
    logged :boolean;
    //openid :string;
    uid :string;
};

export async function whoami() :Promise<UserData | null>{
    const AT = await localforage.getItem<string>("access_token");
    if(AT === null) return null;
    else{
        const
            request = await fetch(`${meta.apiDomain}/v1/admin/loginstatus`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${AT}`
                }
            }),
            uid = (await request.json() as IsLoggedInResponse).uid;
        if(uid){
            const request = await (await fetch(`${meta.apiDomain}/v1/status/getUser?uid=${uid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${AT}`
                }
            })).json() as GetUserResponse;
            //如果data为错误string，则success必为false
            if(request.success) return request.data as UserData;
            else return null;
        }
        else return null;
    }
}

export async function isLoggedIn() :Promise<boolean>{
    const AT = await localforage.getItem<string>("access_token");
    if(AT === null) return false;
    else{
        const request = await fetch(`${meta.apiDomain}/v1/admin/loginstatus`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AT}`
            }
        });
        return !!(await request.json() as IsLoggedInResponse).logged;
    }
}