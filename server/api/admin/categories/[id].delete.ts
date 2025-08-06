import { Params } from "~~/server/modules";
import { verifyAdminPermission } from "~~/server/modules/admin";
import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Categories.Delete");
    logger.info("管理员删除分类接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        logger.trace("获取分类 ID 参数", JobId);
        const categoryId = getRouterParam(event, "id");
        logger.trace("验证分类 ID 是否存在", JobId);
        Params.verify("缺少分类 ID", "MISSING_CATEGORY_ID", categoryId);

        logger.trace("检查分类是否存在", JobId);
        const { data: existingCategory, error: _ } = await supabase.from("categories").select("id, count").eq("id", categoryId).single();
        if (!existingCategory) {
            logger.warning("分类不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "分类不存在",
                data: { errorCode: "CATEGORY_NOT_FOUND" },
            });
        }

        logger.trace("检查分类下是否有内容", JobId);
        if (existingCategory.count !== 0) {
            logger.warning("分类下有内容，无法删除", JobId);
            throw createError({
                statusCode: 400,
                message: "分类下有内容，无法删除",
                data: { errorCode: "CATEGORY_NOT_EMPTY" },
            });
        }

        // 执行删除操作
        logger.trace("执行数据库删除操作", JobId);
        const { error: deleteError } = await supabase.from("categories").delete().eq("id", categoryId);
        if (deleteError) {
            logger.error(`删除分类失败: ${deleteError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "删除分类失败",
                data: { errorCode: "DELETE_CATEGORY_FAILED" },
            });
        }

        logger.info("分类删除成功", JobId);
        return {
            message: "分类删除成功",
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
