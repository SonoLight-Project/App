import supabase from "../../utils/db";
import logger from "../../utils/logging";
import { defineEventHandler, setCookie } from "h3";
import { random } from "lodash-es";
import { desensitization } from "../../utils/desensitization";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API Auth/Logout #${random(9999)}`);
    logger.info("登出接口开始处理请求", JobId);

    try {
        logger.trace("获取用户 ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`获取用户 ID 结果: ${userId ? desensitization(userId) : "[未登录]"}`, JobId);

        if (!userId) {
            logger.warning("用户未登录，后端操作已取消", JobId);
            throw createError({
                statusCode: 400,
                message: "用户未登录",
                data: { errorCode: "LOGOUT:USER_NOT_LOGGED_IN" },
            });
        }

        // 清除数据库中的refresh token
        logger.trace("清除数据库中的刷新令牌", JobId);
        const { error } = await supabase.from("users").update({ refreshToken: null }).eq("id", userId);
        if (error) {
            logger.error(`清除数据库刷新令牌失败: ${error.message}`, JobId);
            throw createError({ statusCode: 500, message: "Failed to clear refresh token" });
        }
        logger.debug("数据库刷新令牌已清除", JobId);

        // 清除客户端cookies
        logger.trace("清除访问令牌 Cookie", JobId);
        setCookie(event, "accessToken", "", { maxAge: 0 });
        logger.debug("访问令牌 Cookie 已清除", JobId);

        logger.trace("清除刷新令牌 Cookie", JobId);
        setCookie(event, "refreshToken", "", { maxAge: 0 });
        logger.debug("刷新令牌 Cookie 已清除", JobId);

        logger.info("用户登出成功: " + desensitization(userId), JobId);
        logger.info("准备返回登出成功信息", JobId);

        return { message: "注销成功" };
    } catch (error: any) {
        // 检查是否是自定义错误，如果不是则记录fatal日志
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
