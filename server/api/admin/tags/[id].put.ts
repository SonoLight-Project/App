import { Params } from "~~/server/modules";
import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Tags.Update");
    logger.info("管理员更新标签信息接口开始处理请求", JobId);

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
        const perfUser = await supabase.from("users").select("role").eq("id", perfUserId).single();
        if (!perfUser.data || perfUser.data.role < 8) {
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
        const tagId = getRouterParam(event, "id");

        logger.trace("验证标签 ID 和更新数据是否存在", JobId);
        Params.verify("缺少标签 ID 或更新数据", "MISSING_TAG_ID_OR_UPDATES", tagId, updates);

        logger.trace("验证更新数据格式", JobId);
        if (!Array.isArray(updates)) {
            logger.warning("更新数据格式错误，应为数组", JobId);
            throw createError({ statusCode: 400, message: "更新数据格式错误，应为数组", data: { errorCode: "INVALID_UPDATES_FORMAT" } });
        }

        logger.trace("验证更新数据字段", JobId);
        const allowedKeys = ["name", "description"];
        const updateObject: Record<string, any> = {};
        for (const [key, value] of updates) {
            if (allowedKeys.includes(key)) {
                updateObject[key] = value;
            } else {
                logger.warning(`更新数据中包含不允许修改的字段: ${key}`, JobId);
            }
        }

        logger.trace("检查标签是否存在", JobId);
        const { data: existingTag, error: _ } = await supabase.from("tags").select("id").eq("id", tagId).single();
        if (!existingTag) {
            logger.warning("标签不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "标签不存在",
                data: { errorCode: "TAG_NOT_FOUND" },
            });
        }

        logger.trace("执行数据库更新操作", JobId);
        const { error: updateError } = await supabase.from("tags").update(updateObject).eq("id", tagId);
        if (updateError) {
            logger.error(`数据库更新失败: ${updateError.message}`, JobId);
            throw createError({ statusCode: 500, message: "数据库更新失败", data: { errorCode: "DATABASE_UPDATE_FAILED" } });
        }

        logger.info("标签信息更新成功", JobId);
        return {
            message: "标签信息更新成功",
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
