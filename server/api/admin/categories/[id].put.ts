import { Params } from "~~/server/modules";
import { verifyAdminPermission } from "~~/server/modules/admin";
import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Categories.Update");
    logger.info("管理员更新分类信息接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { updates } = body; // 期望接收一个 [string, any][] 类型的数组
        const categoryId = getRouterParam(event, "id");

        logger.trace("验证分类 ID 和更新数据是否存在", JobId);
        Params.verify("缺少分类 ID 或更新数据", "MISSING_CATEGORY_ID_OR_UPDATES", categoryId, updates);

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

        logger.trace("检查分类是否存在", JobId);
        const { data: existingCategory, error: _ } = await supabase.from("categories").select("id").eq("id", categoryId).single();
        if (!existingCategory) {
            logger.warning("分类不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "分类不存在",
                data: { errorCode: "CATEGORY_NOT_FOUND" },
            });
        }

        logger.trace("执行数据库更新操作", JobId);
        const { error: updateError } = await supabase.from("categories").update(updateObject).eq("id", categoryId);
        if (updateError) {
            logger.error(`数据库更新失败: ${updateError.message}`, JobId);
            throw createError({ statusCode: 500, message: "数据库更新失败", data: { errorCode: "DATABASE_UPDATE_FAILED" } });
        }

        logger.info("分类信息更新成功", JobId);
        return {
            message: "分类信息更新成功",
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
