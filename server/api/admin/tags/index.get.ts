import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Tags.List");
    logger.info("管理员获取标签列表接口开始处理请求", JobId);

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

        logger.trace("获取查询分页参数", JobId);
        const query = getQuery(event);
        const page = parseInt(query.page as string) || 1;
        const pageSize = parseInt(query.pageSize as string) || 10;
        const offset = (page - 1) * pageSize;
        logger.debug(`查询分页参数: page=${page}, pageSize=${pageSize}, offset=${offset}`, JobId);

        logger.trace("执行数据库查询操作", JobId);
        const {
            data: tags,
            error: tagsError,
            count,
        } = await supabase
            .from("tags")
            .select("id, name, description, slug, count", { count: "exact" })
            .range(offset, offset + pageSize - 1);

        if (tagsError) {
            logger.error(`查询标签列表失败: ${tagsError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "查询标签列表失败",
                data: { errorCode: "FETCH_CATEGORIES_FAILED" },
            });
        }

        logger.info("标签列表获取成功", JobId);
        return {
            message: "标签列表获取成功",
            tags,
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
