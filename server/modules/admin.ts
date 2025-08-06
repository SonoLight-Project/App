import { Userdata } from "~~/server/modules";

export const verifyAdminPermission = async (JobId: number, event: any): Promise<Error | null> => {
    logger.trace("鉴权：获取操作者 ID", JobId);
    const perfUserId = event.context.auth?.user?.id;
    logger.debug(`鉴权：操作者 ID 获取完成: ${perfUserId ? "存在" : "不存在"}`, JobId);
    if (!perfUserId) {
        logger.error("需要先登录", JobId);
        return createError({
            statusCode: 401,
            message: "需要先登录",
            data: { errorCode: "NOT_LOGGED_IN" },
        });
    }

    logger.trace("鉴权：查询操作者信息", JobId);
    const perfUser = await Userdata.getUserRecordUsersOnly(JobId, "id", perfUserId);
    if (perfUser.userRole < 8) {
        logger.warning("鉴权：权限不足", JobId);
        return createError({
            statusCode: 403,
            message: "权限不足",
            data: { errorCode: "OPERATOR_NOT_ADMIN" },
        });
    }

    return null
};
