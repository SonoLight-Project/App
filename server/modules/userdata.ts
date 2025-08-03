import { IOAuthDBRecord, IUsersDBRecord } from "~~/server/types/User";

export const getUserRecord = async (JobId: number, key: string, value: string): Promise<[IUsersDBRecord, IOAuthDBRecord]> => {
    const user_users = await getUserRecordUsersOnly(JobId, key, value);
    const user_oauth = await getUserRecordOAuthOnly(JobId, key, value);

    return [user_users, user_oauth];
};

export const getUserRecordUsersOnly = async (JobId: number, key: string, value: string): Promise<IUsersDBRecord> => {
    logger.trace("查询用户基本信息", JobId);
    const { data: user_users } = await supabase.from("users").select("*").eq(key, value).single();

    logger.debug(`用户基本信息查询结果: ${user_users ? "找到用户" : "未找到用户"}`, JobId);

    return user_users;
};

export const getUserRecordOAuthOnly = async (JobId: number, key: string, value: string): Promise<IOAuthDBRecord> => {
    logger.trace("查询用户 OAuth 信息", JobId);
    const { data: user_oauth } = await supabase.from("oauth").select("*").eq(key, value).single();

    logger.debug(`用户 OAuth 信息查询结果: ${user_oauth ? "找到 OAuth 记录" : "未找到 OAuth 记录"}`, JobId);

    return user_oauth;
};
