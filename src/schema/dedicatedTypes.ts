export type URLLike = string & {
    i_am_a_convertable_type_to_URL :never;
};

export function toUrl(url :URLLike) :string{
    return url as unknown as string;
}

export type DateLike = string & {
    i_am_a_convertable_type_to_Date :never;
};

export function toDate(date :DateLike) :Date{
    return new Date(date as unknown as string);
}