import { Userdata, Response, Params } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Get");
    logger.info("管理员获取用户信息接口开始处理请求", JobId);

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

        // 查询用户信息
        logger.trace("执行数据库查询操作", JobId);
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", userId!);

        if (!user_users || !user_oauth) {
            logger.warning("用户不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "用户不存在",
                data: { errorCode: "USER_NOT_FOUND" },
            });
        }

        logger.info("用户信息获取成功", JobId);
        return {
            message: "用户信息获取成功",
            user: Response.wrapUserResponse(user_users, user_oauth),
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
