import { setCookie } from "h3";

export const setEventCookie = (JobId: number, event: any, accessToken: string, refreshToken: string) => {
    logger.trace("设置访问令牌 Cookie", JobId);
    setCookie(event, "accessToken", accessToken, {
        httpOnly: true,
        sameSite: true,
        maxAge: 60 * 15, // 15 m
    });

    logger.trace("设置刷新令牌 Cookie", JobId);
    setCookie(event, "refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: true,
        maxAge: 60 * 60 * 24 * 7, // 7 d
    });
};

export const revokeEventCookie = async (JobId: number, event: any, userId: number) => {
    // 清除数据库中的 refreshToken
    logger.trace("清除数据库中的刷新令牌", JobId);
    const { error } = await supabase.from("users").update({ refreshToken: null }).eq("id", userId);
    if (error) {
        logger.error(`清除数据库刷新令牌失败: ${error.message}`, JobId);
        throw createError({ statusCode: 500, message: "Failed to clear refresh token" });
    }
    logger.debug("数据库刷新令牌已清除", JobId);

    logger.trace("清除访问令牌 Cookie", JobId);
    setCookie(event, "accessToken", "", { maxAge: 0 });
    logger.debug("访问令牌 Cookie 已清除", JobId);

    logger.trace("清除刷新令牌 Cookie", JobId);
    setCookie(event, "refreshToken", "", { maxAge: 0 });
    logger.debug("刷新令牌 Cookie 已清除", JobId);
};
