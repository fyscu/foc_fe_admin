

//POST `v1/admin/getLuckyResult`
export type getLuckyResponse = {
    success :boolean;
    winning_nums :string[];
    winning_user_ids :string[];
    max_luckynum :string;
    //string[][]
    luckyHistory :string;
};