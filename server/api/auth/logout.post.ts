import { defineEventHandler } from "h3";
import { Cookie } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`Api.Auth.Logout`);
    logger.info("登出接口开始处理请求", JobId);

    try {
        logger.trace("获取用户 ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`获取用户 ID 结果: ${userId ? desensitization(userId) : "[未登录]"}`, JobId);

        if (!userId) {
            logger.warning("用户未登录，后端操作已取消", JobId);
            throw createError({
                statusCode: 401,
                message: "用户未登录",
                data: { errorCode: "USER_NOT_LOGGED_IN" },
            });
        }

        logger.trace("清除用户 Cookie", JobId);
        Cookie.revokeEventCookie(JobId, event, userId);

        logger.info("用户登出成功: " + desensitization(userId), JobId);
        return { message: "注销成功" };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
