import supabase from "../../../utils/db";
import logger from "../../../utils/logging";
import { defineEventHandler, setCookie, readBody } from "h3";
import { stringify } from "querystring";
import { SignJWT } from "jose/jwt/sign";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API OAuth/MCJPG/Login #${random(9999)}`);
    try {
        logger.info("开始处理 MCJPG 登录请求", JobId);

        logger.trace("读取请求体中的授权码", JobId);
        const { code } = await readBody(event);
        logger.debug(`授权码读取完成: ${code ? "存在" : "不存在"}`, JobId);

        if (!code) {
            logger.warning("缺少授权码", JobId);
            throw createError({ statusCode: 400, message: "缺少授权码" });
        }

        // 交换code获取access token
        logger.trace("交换 Code 获取 AccessToken", JobId);
        let tokenResponse;
        try {
            tokenResponse = await $fetch("https://sso.mcjpg.org/api/login/oauth/access_token", {
                method: "POST",
                body: stringify({
                    grant_type: "authorization_code",
                    client_id: process.env.MCJPG_CLIENT_ID,
                    client_secret: process.env.MCJPG_CLIENT_SECRET,
                    code,
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
            });
            logger.debug("AccessToken 获取成功", JobId);
        } catch (error: any) {
            switch (error.statusCode) {
                case 400:
                    logger.warning("授权无效：登录已过期", JobId);
                    throw createError({
                        statusCode: 400,
                        message: "授权无效：登录已过期，请重试",
                        data: { errorCode: "MCJPG_OAUTH_LOGIN:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权失败：发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权失败：发生意外错误，请联系管理",
                        data: { errorCode: "MCJPG_OAUTH_LOGIN:UNEXCEPTED_ERROR", errorDetails: error.message },
                    });
            }
        }

        const { access_token } = tokenResponse as { access_token: string };

        // 获取用户信息
        logger.trace("获取 MCJPG 用户信息", JobId);
        let userInfo;
        try {
            userInfo = await $fetch("https://sso.mcjpg.org/api/userinfo", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            logger.debug("用户信息获取成功", JobId);
        } catch (error: any) {
            switch (error.statusCode) {
                case 401:
                    logger.error("授权无效：登录已过期或无效", JobId);
                    throw createError({
                        statusCode: 400,
                        message: "授权无效：登录已过期或无效，请尝试重新登录",
                        data: { errorCode: "MCJPG_OAUTH_LOGIN:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权无效：获取用户信息时发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                        data: { errorCode: "MCJPG_OAUTH_LOGIN:UNEXCEPTED_ERROR", errorDetails: error.message },
                    });
            }
        }

        const { sub: id } = userInfo as { sub: string };

        // 查找MCJPG ID匹配的用户
        logger.trace("查找 MCJPG ID 匹配的用户", JobId);
        const { data: user_oauth } = await supabase.from("oauth").select("*").eq("mcjpgId", id).single();
        logger.debug(`用户查找完成: ${user_oauth ? "找到" : "未找到"}`, JobId);

        if (!user_oauth) {
            logger.error("未找到关联账户", JobId);
            throw createError({
                statusCode: 401,
                message: "未找到关联账户",
                data: { errorCode: "MCJPG_OAUTH_LOGIN:NO_ASSOCIATED_ACCOUNT" },
            });
        }

        logger.trace("获取用户详细信息", JobId);
        const { data: user_users } = await supabase.from("users").select("id, username, role").eq("id", user_oauth.id).single();
        logger.debug(`用户详细信息获取完成: ${user_users ? "找到" : "未找到"}`, JobId);

        if (!user_users) {
            logger.error("未找到关联账户", JobId);
            throw createError({
                statusCode: 401,
                message: "未找到关联账户",
                data: { errorCode: "MCJPG_OAUTH_LOGIN:NO_ASSOCIATED_ACCOUNT" },
            });
        }

        logger.trace("生成 AccessToken", JobId);
        const accessToken = await new SignJWT({ id: user_users.id, role: user_users.role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("15m")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
        logger.debug("AccessToken 生成成功", JobId);

        logger.trace("生成 refreshToken", JobId);
        const refreshToken = await new SignJWT({ id: user_users.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));
        logger.debug("refresh token 生成成功", JobId);

        logger.trace("保存 refreshToken 到数据库", JobId);
        await supabase.from("users").update({ refreshToken }).eq("id", user_users.id);
        logger.debug("refreshToken 保存成功", JobId);

        logger.trace("设置 HTTP-only Cookie", JobId);
        setCookie(event, "accessToken", accessToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 15, // 15 m
        });

        setCookie(event, "refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 60 * 24 * 7, // 7 d
        });
        logger.debug("Cookie 设置完成", JobId);

        logger.info("MCJPG 登录请求处理完成", JobId);
        return {
            message: "登录成功",
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
