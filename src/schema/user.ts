import { URLLike } from "./dedicatedTypes";

//`/v1/admin/getnum/user`
export type GetUserNumResponse = {
    success :boolean;
    total_users :number;
};

//`/v1/status/getUser`
export type GetUserResponse = {
    success :boolean;
    request_type :"all" | "unique_query";
    data :UserData[] | UserData | string;
};

//`/v1/status/getUser`.data
export type UserData = {
    id :string;
    openid :string;
    token_expiry :string;
    regtime :string;
    nickname :string;
    avatar :URLLike;
    campus :"江安" | "望江" | "华西";
    role :"admin" | "technician" | "user";
    email :string;
    email_status: "verified" | "unverified";
    phone :string;
    status :"verified" | "pending";
    immed :"0" | "1";
    /**技术员：是否可用，`"0" | "1"`；用户：报修限额，`"0" | "1" | "2" | "3" | "4" | "5"`*/
    available :"0" | "1" | "2" | "3" | "4" | "5";
    wants :"a" | "b" | "c" | "d" | "e";
};

//`/v1/user/delete`.data
export type UserDeleteResponse = {
    success :boolean;
    message :string;
};