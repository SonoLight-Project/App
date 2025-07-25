import supabase from "../../utils/db";
import logger from "../../utils/logging";
import { jwtVerify } from "jose/jwt/verify";
import { SignJWT } from "jose/jwt/sign";
import { random } from "lodash-es";
import { desensitization } from "../../utils/desensitization";

import { defineEventHandler, getCookie, setCookie } from "h3";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API Auth/Refresh #${random(9999)}`);
    logger.info("刷新令牌接口开始处理请求", JobId);

    logger.trace("从 Cookie 中获取刷新令牌", JobId);
    // 从Cookie中获取refreshToken
    const refreshToken = getCookie(event, "refreshToken");
    logger.debug(`获取刷新令牌: ${refreshToken ? "存在" : "不存在"}`, JobId);

    if (!refreshToken) {
        logger.warning("未提供刷新令牌", JobId);
        throw createError({
            statusCode: 401,
            message: "未提供 refreshToken",
            data: { errorCode: "REFRESH:MISSING_TOKEN" },
        });
    }

    try {
        logger.trace("验证刷新令牌", JobId);
        // 验证refreshToken
        const { payload } = await jwtVerify(refreshToken, new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));
        logger.debug("刷新令牌验证通过", JobId);

        logger.trace("解码刷新令牌", JobId);
        const decoded = payload as { id: string };
        logger.debug(`解码刷新令牌ID: ${desensitization(decoded.id)}`, JobId);

        // 查询用户并验证refreshToken
        logger.trace("查询用户信息", JobId);
        const { data: user_users } = await supabase.from("users").select("*").eq("id", decoded.id).single();

        if (!user_users || user_users.refreshToken !== refreshToken) {
            logger.error("刷新令牌无效或已过期，用户 ID: " + desensitization(decoded.id), JobId);
            throw createError({
                statusCode: 401,
                message: "refreshToken 无效或已过期",
                data: { errorCode: "REFRESH:INVALID_TOKEN" },
            });
        }
        logger.debug(`用户信息查询成功: ${user_users ? "找到用户" : "未找到用户"}`, JobId);

        logger.trace("查询用户 OAuth 信息", JobId);
        const { data: user_oauth } = await supabase.from("oauth").select("*").eq("id", user_users.id).single();
        if (!user_oauth) {
            logger.warning("用户 OAuth 信息不存在，用户 ID: " + desensitization(user_users.id), JobId);
            throw createError({
                statusCode: 401,
                message: "用户 OAuth 信息不存在",
                data: { errorCode: "REFRESH:USER_OAUTH_NOT_FOUND" },
            });
        }
        logger.debug(`用户 OAuth 信息查询结果: ${user_oauth ? "找到记录" : "未找到记录"}`, JobId);

        logger.trace("生成新的访问令牌", JobId);
        // 生成新的accessToken
        const accessToken = await new SignJWT({ id: user_users.id, role: user_users.role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("15m")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
        logger.debug("访问令牌生成成功", JobId);

        logger.trace("设置新的访问令牌 Cookie", JobId);
        // 设置新的accessToken到Cookie
        setCookie(event, "accessToken", accessToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 15, // 15分钟
        });
        logger.debug("访问令牌 Cookie 设置完成", JobId);

        logger.info("令牌刷新成功，用户 ID: " + desensitization(user_users.id), JobId);
        logger.info("准备返回用户信息", JobId);
        return {
            message: "已刷新 AccessToken",
            user: {
                ...user_users,
                ...user_oauth,
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
