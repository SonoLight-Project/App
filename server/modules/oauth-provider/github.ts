import { stringify } from "querystring";

export const getAccessToken = async (JobId: number, code: any) => {
    logger.trace("交换 Code 获取 AccessToken", JobId);
    let tokenResponse;
    try {
        tokenResponse = await $fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            body: stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
        });
        logger.debug("access token 获取成功", JobId);
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
    logger.trace("获取 GitHub 用户信息", JobId);
    let userInfo;
    try {
        userInfo = await $fetch("https://api.github.com/user", {
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
    const { id } = userInfo as { id: number };

    logger.trace("查找 GitHub ID 匹配的用户", JobId);
    const { data: user_oauth } = await supabase.from("oauth").select("*").eq("githubId", id).single();

    logger.debug(`用户查找完成: ${user_oauth ? "找到" : "未找到"}`, JobId);
    if (!user_oauth) {
        logger.error("未找到关联账户", JobId);
        throw createError({
            statusCode: 401,
            message: "未找到关联账户",
            data: { errorCode: "NO_ASSOCIATED_ACCOUNT" },
        });
    }

    return user_oauth;
};
