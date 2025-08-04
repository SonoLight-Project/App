import { defineEventHandler, getCookie } from "h3";
import { jwtVerify } from "jose/jwt/verify";
import { Jwt, Userdata, Cookie, Response } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Auth.Refresh");
    logger.info("刷新令牌接口开始处理请求", JobId);

    logger.trace("从 Cookie 中获取刷新令牌", JobId);
    const refreshToken = getCookie(event, "refreshToken");
    logger.debug(`获取刷新令牌: ${refreshToken ? "存在" : "不存在"}`, JobId);

    if (!refreshToken) {
        logger.warning("未提供刷新令牌", JobId);
        throw createError({
            statusCode: 401,
            message: "未提供 refreshToken",
            data: { errorCode: "MISSING_TOKEN" },
        });
    }

    try {
        logger.trace("验证刷新令牌", JobId);
        // 验证 refreshToken
        const { payload } = await jwtVerify(refreshToken, new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));
        logger.debug("刷新令牌验证通过", JobId);

        logger.trace("解码刷新令牌", JobId);
        const decoded = payload as { id: string };
        logger.debug(`解码刷新令牌ID: ${desensitization(decoded.id)}`, JobId);

        // 查询用户并验证refreshToken
        logger.trace("查询用户信息", JobId);
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", decoded.id);
        if (!user_users || user_users.refreshToken !== refreshToken) {
            logger.error("刷新令牌无效或已过期，用户 ID: " + desensitization(decoded.id), JobId);
            throw createError({
                statusCode: 401,
                message: "refreshToken 无效或已过期",
                data: { errorCode: "INVALID_TOKEN" },
            });
        }
        if (!user_oauth) {
            logger.warning("用户 OAuth 信息不存在，用户 ID: " + desensitization(user_users.id), JobId);
            throw createError({
                statusCode: 401,
                message: "用户 OAuth 信息不存在",
                data: { errorCode: "USER_OAUTH_NOT_FOUND" },
            });
        }

        const accessTokenNew = await Jwt.signAccessToken(JobId, user_users);
        const refreshTokenNew = await Jwt.signRefreshTokenAndSave(JobId, user_users);

        Cookie.setEventCookie(JobId, event, accessTokenNew, refreshTokenNew);

        logger.info("令牌刷新成功，用户 ID: " + desensitization(user_users.id), JobId);
        return {
            message: "已刷新 AccessToken",
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
