import { Userdata, Params } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Delete");
    logger.info("管理员删除用户接口开始处理请求", JobId);

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

        // 获取用户ID参数
        const userId = getRouterParam(event, "id");
        logger.trace("验证用户 ID 是否存在", JobId);
        Params.verify("缺少用户 ID", "MISSING_USER_ID", userId);

        // 检查要删除的用户是否存在
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", userId!);
        if (!user_users || !user_oauth) {
            logger.warning("用户不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "用户不存在",
                data: { errorCode: "USER_NOT_FOUND" },
            });
        }

        // 执行删除操作
        logger.trace("执行数据库删除操作", JobId);
        const { error: oauthError } = await supabase.from("oauth").delete().eq("id", userId);
        if (oauthError) {
            logger.error(`删除 OAuth 记录失败: ${oauthError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "删除 OAuth 记录失败",
                data: { errorCode: "DELETE_OAUTH_FAILED" },
            });
        }

        const { error: userError } = await supabase.from("users").delete().eq("id", userId);
        if (userError) {
            logger.error(`删除用户失败: ${userError.message}`, JobId);
            // 如果删除 users 表失败，尝试回滚 oauth 表的删除操作
            await supabase.from("oauth").insert(user_oauth);
            throw createError({
                statusCode: 500,
                message: "删除用户失败",
                data: { errorCode: "DELETE_USER_FAILED" },
            });
        }

        logger.info("用户删除成功", JobId);
        return {
            message: "用户删除成功",
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
