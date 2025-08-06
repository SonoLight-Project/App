import { verifyAdminPermission } from "~~/server/modules/admin";
import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Categories.List");
    logger.info("管理员获取分类列表接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        // 获取分页参数
        const query = getQuery(event);
        const page = parseInt(query.page as string) || 1;
        const pageSize = parseInt(query.pageSize as string) || 10;
        const offset = (page - 1) * pageSize;

        logger.trace("执行数据库查询操作", JobId);
        // 查询分类列表
        const {
            data: categories,
            error: categoriesError,
            count,
        } = await supabase
            .from("categories")
            .select("id, name, description, slug, count", { count: "exact" })
            .range(offset, offset + pageSize - 1);

        if (categoriesError) {
            logger.error(`查询分类列表失败: ${categoriesError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "查询分类列表失败",
                data: { errorCode: "FETCH_CATEGORIES_FAILED" },
            });
        }

        logger.info("分类列表获取成功", JobId);
        return {
            message: "分类列表获取成功",
            categories: categories,
            pagination: {
                page,
                pageSize,
                total: count,
                totalPages: Math.ceil(count! / pageSize),
            },
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
