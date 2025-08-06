import { Params } from "~~/server/modules";
import { verifyAdminPermission } from "~~/server/modules/admin";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Update");
    logger.info("管理员更新用户信息接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { updates } = body; // 期望接收一个 [string, string][] 类型的数组
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
        const isUserKeys = ["userName", "userRole"];
        const updateObjectUsers: Record<string, string> = {};
        const isOAuthKeys = [..._genOAuthKey("discord"), ..._genOAuthKey("github"), ..._genOAuthKey("mcjpg")];
        const updateObjectOAuth: Record<string, string> = {};
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
            logger.error(`数据库更新失败（用户表）: ${errorUsers.message}`, JobId);
            throw createError({ statusCode: 500, message: "数据库更新失败（用户表）", data: { errorCode: "DATABASE_UPDATE_FAILED" } });
        }
        const { error: errorOAuth } = await supabase.from("oauth").update(updateObjectOAuth).eq("id", userId);
        if (errorOAuth) {
            logger.error(`数据库更新失败（OAuth 表）: ${errorOAuth.message}`, JobId);
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
