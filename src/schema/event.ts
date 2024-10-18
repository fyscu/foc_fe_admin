import { URLLike } from "./dedicatedTypes";

//`/v1/status/getEvent`
export type GetEventResponse = {
    success :boolean;
    activities :EventData[];
};

export type EventData = {
    id :string;
    name :string;
    type :"讲座" | "例会" | "大修" | "其他";
    description :string;
    poster :URLLike;
    //Date
    create_time :string;
    //Date
    start_time :string;
    //Date
    end_time :string;
    //Date
    signup_start_time :string;
    //Date
    signup_end_time :string;
    //string[][]
    winnum :string | null;
    registered :boolean;
    isLucky :"0" | "1";
    max_luckynum :string;
};