import supabase from "../../../utils/db";
import logger from "../../../utils/logging";
import { defineEventHandler } from "h3";
import { stringify } from "querystring";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API OAuth/Discord/Bind #${random(9999)}`);
    try {
        logger.info("开始处理 Discord 绑定请求", JobId);

        logger.trace("读取请求体中的授权码", JobId);
        const { code } = await readBody(event);
        logger.debug(`授权码读取完成: ${code ? "存在" : "不存在"}`, JobId);

        if (!code) {
            logger.warning("缺少授权码", JobId);
            throw createError({
                statusCode: 400,
                message: "缺少授权码",
                data: { errorCode: "DC_OAUTH_BIND:MISSING_AUTH_CODE" },
            });
        }

        logger.trace("交换 Code 获取 AccessToken", JobId);
        let tokenResponse;
        try {
            tokenResponse = await $fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                body: stringify({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: process.env.DISCORD_REDIRECT_URI,
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
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
                        data: { errorCode: "DC_OAUTH_BIND:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权失败：发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权失败：发生意外错误，请联系管理员",
                        data: { errorCode: "DC_OAUTH_BIND:UNEXPECTED_ERROR", errorDetails: error.message },
                    });
            }
        }

        const { access_token } = tokenResponse as { access_token: string };
        logger.debug(`AccessToken: ${desensitization(access_token)}`, JobId);

        // 获取用户信息
        logger.trace("获取 Discord 用户信息", JobId);
        let userInfo;
        try {
            userInfo = await $fetch("https://discord.com/api/users/@me", {
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
                        data: { errorCode: "DC_OAUTH_BIND:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权无效：获取用户信息时发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                        data: { errorCode: "DC_OAUTH_BIND:UNEXPECTED_ERROR", errorDetails: error.message },
                    });
            }
        }

        const { id, username } = userInfo as { id: string; username: string };

        logger.trace("获取用户ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`用户ID获取完成: ${userId ? "存在" : "不存在"}`, JobId);

        if (!userId) {
            logger.error("需要先登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "DC_OAUTH_BIND:USER_NOT_LOGGED_IN" },
            });
        }

        // 检查是否已被绑定
        logger.trace("检查 Discord 账户是否已被绑定", JobId);
        const { data: existing } = await supabase.from("oauth").select("*").eq("discord_id", id).neq("id", userId).single();
        logger.debug(`检查完成: ${existing ? "已绑定" : "未绑定"}`, JobId);

        if (existing) {
            logger.warning("该 Discord 账户已被其他用户绑定", JobId);
            throw createError({
                statusCode: 409,
                message: "该 Discord 账户已被其他用户绑定",
                data: { errorCode: "DC_OAUTH_BIND:DISCORD_ACCOUNT_ALREADY_BOUND" },
            });
        }

        // 绑定Discord账户
        logger.trace("绑定 Discord 账户", JobId);
        await supabase.from("oauth").update({ discordId: id, discordUsername: username }).eq("id", userId);
        logger.debug("Discord 账户绑定成功", JobId);

        logger.trace("获取更新后的用户信息", JobId);
        const { data: updatedUser_users } = await supabase.from("users").select("id, username, role").eq("id", userId).single();
        const { data: updatedUser_oauth } = await supabase.from("oauth").select("*").eq("id", userId).single();
        logger.debug("用户信息获取完成", JobId);

        logger.info("Discord 绑定请求处理完成", JobId);
        return { message: "绑定成功", user: { ...updatedUser_users, ...updatedUser_oauth } };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
