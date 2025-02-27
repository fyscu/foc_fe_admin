import { DateLike, URLLike } from "./dedicatedTypes";

//`/v1/status/getTicket`
export type GetOrderResponse = {
    success :boolean;
    request_type :"by_workorder_id" | "by_user_id_pending" | "by_user_id_all" | "by_campus" | "by_technician_id_pending" | "by_technician_id_all" | "all_workorders_done" | "all_workorders_pending" | "all_workorders";
    data :OrderData[];
};

//`/v1/status/getTicket`.data
export type OrderData = {
    id :string;
    user_id :string;
    machine_purchase_date :DateLike;
    user_phone :string;
    device_type :"笔记本";
    computer_brand :string;
    repair_description :string;
    repair_status :"Pending";
    repair_image_url :URLLike;
    fault_type :"清灰";
    qq_number :string;
    campus :"江安" | "望江" | "华西";
    assigned_technician_id :string;
    assigned_time :DateLike;
    completion_time :"null" | DateLike;
};