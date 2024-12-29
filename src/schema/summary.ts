import { DateLike } from "./dedicatedTypes";

export type TicketHistory = {
    date :DateLike;
    count :number;
};

//`/v1/admin/getSummary`.data
export type GetSummaryResponse = {
    thisDayTickets :number;
    thisMonthTickets :number;
    thisYearTickets :number;
    totalTickets :number;
    totalTech :number;
    totalUser :number;
    totalFeedback :number;
    recentTickets :[TicketHistory, TicketHistory, TicketHistory, TicketHistory, TicketHistory];
}