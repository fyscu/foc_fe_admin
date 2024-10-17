export interface URLLike extends String{
    i_am_a_convertable_type_to_URL :never;
}

export function toUrl(url :URLLike) :string{
    return url as unknown as string;
}

export interface DateLike extends String{
    i_am_a_convertable_type_to_Date :never;
}

export function toDate(date :DateLike) :Date{
    return new Date(date as unknown as string);
}