import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Categories.List");
    logger.info("管理员获取分类列表接口开始处理请求", JobId);

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
