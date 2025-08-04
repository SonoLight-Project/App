import { Userdata, Params } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Update");
    logger.info("管理员更新用户信息接口开始处理请求", JobId);

    try {
        logger.trace("鉴权：获取操作者 ID", JobId);
        const perfUserId = event.context.auth?.user?.id;
        logger.debug(`鉴权：操作者 ID 获取完成: ${perfUserId ? "存在" : "不存在"}`, JobId);
        if (!perfUserId) {
            logger.error("需要先登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "NOT_LOGGED_IN" },
            });
        }

        logger.trace("鉴权：查询操作者信息", JobId);
        const perfUser = await Userdata.getUserRecordUsersOnly(JobId, "id", perfUserId);
        if (!perfUser) {
            logger.error("操作者不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "操作者不存在",
                data: { errorCode: "OPERATOR_NOT_FOUND" },
            });
        }
        logger.debug(`鉴权：操作者信息查询完成: ${perfUser ? "存在" : "不存在"}`, JobId);
        if (perfUser.role < 8) {
            logger.warning("鉴权：权限不足", JobId);
            throw createError({
                statusCode: 403,
                message: "权限不足",
                data: { errorCode: "OPERATOR_NOT_ADMIN" },
            });
        }

        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { updates } = body; // 期望接收一个 [string, any][] 类型的数组
        const userId = getRouterParam(event, "id");

        logger.trace("验证用户 ID 和更新数据是否存在", JobId);
        Params.verify("缺少用户 ID 或更新数据", "MISSING_USER_ID_OR_UPDATES", userId, updates);

        logger.trace("验证更新数据格式", JobId);
        if (!Array.isArray(updates)) {
            logger.warning("更新数据格式错误，应为数组", JobId);
            throw createError({ statusCode: 400, message: "更新数据格式错误，应为数组", data: { errorCode: "INVALID_UPDATES_FORMAT" } });
        }

        logger.trace("验证更新数据字段", JobId);
        const _genOAuthKey = (p: string) => [`${p}Id`, `${p}Username`];
        const isUserKeys = ["username", "role"];
        const updateObjectUsers: Record<string, any> = {};
        const isOAuthKeys = [..._genOAuthKey("discord"), ..._genOAuthKey("github"), ..._genOAuthKey("mcjpg")];
        const updateObjectOAuth: Record<string, any> = {};
        for (const [key, value] of updates) {
            if (isUserKeys.includes(key)) {
                updateObjectUsers[key] = value;
            } else if (isOAuthKeys.includes(key)) {
                updateObjectOAuth[key] = value;
            } else {
                logger.warning(`更新数据中包含未知字段: ${key}`, JobId);
            }
        }

        logger.trace("执行数据库更新操作", JobId);
        const { error: errorUsers } = await supabase.from("users").update(updateObjectUsers).eq("id", userId);
        if (errorUsers) {
            logger.error(`数据库更新失败（用户表）: ${errorUsers.details}`, JobId);
            throw createError({ statusCode: 500, message: "数据库更新失败（用户表）", data: { errorCode: "DATABASE_UPDATE_FAILED" } });
        }
        const { error: errorOAuth } = await supabase.from("oauth").update(updateObjectOAuth).eq("id", userId);
        if (errorOAuth) {
            logger.error(`数据库更新失败（OAuth 表）: ${errorOAuth.details}`, JobId);
            throw createError({ statusCode: 500, message: "数据库更新失败（OAuth 表）", data: { errorCode: "DATABASE_UPDATE_FAILED" } });
        }

        logger.info("用户信息更新成功", JobId);
        return {
            message: "用户信息更新成功",
        };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
