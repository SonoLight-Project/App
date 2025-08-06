import { stringify } from "querystring";

export const getAccessToken = async (JobId: number, code: any) => {
    logger.trace("交换 Code 获取 AccessToken", JobId);
    let tokenResponse;
    try {
        tokenResponse = await $fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: stringify({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        logger.debug("AccessToken 获取成功", JobId);
    } catch (error: any) {
        switch (error.statusCode) {
            case 400:
                logger.warning("授权无效：登录已过期", JobId);
                throw createError({
                    statusCode: 400,
                    message: "授权无效：登录已过期，请重试",
                    data: { errorCode: "TOKEN_EXPIRED" },
                });
            default:
                logger.fatal(`授权失败：发生意外错误: ${error.message}`, JobId);
                throw createError({
                    statusCode: 500,
                    message: "授权失败：发生意外错误，请联系管理",
                    data: { errorCode: "UNEXCEPTED_ERROR", errorDetails: error.message },
                });
        }
    }

    return (tokenResponse as { access_token: string })["access_token"];
};

export const getUserRecord = async (JobId: number, access_token: string) => {
    logger.trace("获取 Discord 用户信息", JobId);
    let userInfo;
    try {
        userInfo = await $fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        logger.debug("用户信息获取成功", JobId);
    } catch (error: any) {
        switch (error.statusCode) {
            case 401:
                logger.error("授权无效：登录已过期或无效", JobId);
                throw createError({
                    statusCode: 400,
                    message: "授权无效：登录已过期或无效，请尝试重新登录",
                    data: { errorCode: "TOKEN_EXPIRED" },
                });
            default:
                logger.fatal(`授权无效：获取用户信息时发生意外错误: ${error.message}`, JobId);
                throw createError({
                    statusCode: 500,
                    message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                    data: { errorCode: "UNEXCEPTED_ERROR", errorDetails: error.message },
                });
        }
    }
    const { id } = userInfo as { id: string };

    logger.trace("查找 Discord ID 匹配的用户", JobId);
    const { data: user_oauth } = await supabase.from("oauth").select("*").eq("discordId", id.toString()).single();

    logger.debug(`用户查找完成: ${user_oauth ? "找到" : "未找到"}`, JobId);
    if (!user_oauth) {
        logger.error("未找到关联账户", JobId);
        throw createError({
            statusCode: 401,
            message: "未找到关联账户",
            data: { errorCode: "NO_ASSOCIATED_ACCOUNT" },
        });
    }

    return user_oauth
};
