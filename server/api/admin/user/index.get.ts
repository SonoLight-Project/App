import { Userdata, Response } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.List");
    logger.info("管理员获取用户列表接口开始处理请求", JobId);

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

        // 获取分页参数
        const query = getQuery(event);
        const page = parseInt(query.page as string) || 1;
        const pageSize = parseInt(query.pageSize as string) || 10;
        const offset = (page - 1) * pageSize;

        logger.trace("执行数据库查询操作", JobId);
        // 查询用户列表
        const { data: users, error: usersError, count } = await supabase
            .from("users")
            .select("*", { count: "exact" })
            .range(offset, offset + pageSize - 1);
        if (usersError) {
            logger.error(`查询用户列表失败: ${usersError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "查询用户列表失败",
                data: { errorCode: "FETCH_USERS_FAILED" },
            });
        }

        // 查询对应的 OAuth 信息
        const userIds = users.map(user => user.id);
        const { data: oauthData, error: oauthError } = await supabase
            .from("oauth")
            .select("*")
            .in("id", userIds);
        if (oauthError) {
            logger.error(`查询 OAuth 信息失败: ${oauthError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "查询 OAuth 信息失败",
                data: { errorCode: "FETCH_OAUTH_FAILED" },
            });
        }

        // 合并用户和 OAuth 信息
        const usersWithOAuth = users.map(user => {
            const oauth = oauthData.find(o => o.id === user.id);
            return Response.wrapUserResponseAdmin(user, oauth);
        });

        logger.info("用户列表获取成功", JobId);
        return {
            message: "用户列表获取成功",
            users: usersWithOAuth,
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