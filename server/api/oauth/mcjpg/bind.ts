import supabase from "../../../utils/db";
import logger from "../../../utils/logging";
import { defineEventHandler, readBody } from "h3";
import { stringify } from "querystring";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API OAuth/MCJPG/Bind #${random(9999)}`);
    try {
        logger.info("开始处理 MCJPG 绑定请求", JobId);

        logger.trace("读取请求体中的授权码", JobId);
        const { code } = await readBody(event);
        logger.debug(`授权码读取完成: ${code ? "存在" : "不存在"}`, JobId);

        if (!code) {
            logger.warning("缺少授权码", JobId);
            throw createError({ statusCode: 400, message: "缺少授权码" });
        }

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
                        data: { errorCode: "MCJPG_OAUTH_BIND:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权失败：发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权失败：发生意外错误，请联系管理",
                        data: { errorCode: "MCJPG_OAUTH_BIND:UNEXCEPTED_ERROR", errorDetails: error.message },
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
                        data: { errorCode: "MCJPG_OAUTH_BIND:TOKEN_EXPIRED" },
                    });
                default:
                    logger.fatal(`授权无效：获取用户信息时发生意外错误: ${error.message}`, JobId);
                    throw createError({
                        statusCode: 500,
                        message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                        data: { errorCode: "MCJPG_OAUTH_BIND:UNEXCEPTED_ERROR", errorDetails: error.message },
                    });
            }
        }

        const { sub: id, name } = userInfo as { sub: string; name: string };

        // 检查账户是否已被绑定
        logger.trace("检查账户是否已被绑定", JobId);
        const { data: existingUser } = await supabase.from("oauth").select("*").eq("mcjpgId", id).single();
        logger.debug(`账户绑定检查完成: ${existingUser ? "已绑定" : "未绑定"}`, JobId);

        if (existingUser) {
            logger.warning("该 MCJPG 账户已被绑定", JobId);
            throw createError({
                statusCode: 409,
                message: "该 MCJPG 账户已被绑定",
                data: { errorCode: "MCJPG_OAUTH_BIND:ALREADY_BOUND" },
            });
        }

        // 绑定账户
        logger.trace("获取用户上下文", JobId);
        const user = event.context.auth?.user;
        logger.debug(`用户上下文获取完成: ${user ? "存在" : "不存在"}`, JobId);

        if (!user) {
            logger.error("用户未登录", JobId);
            throw createError({
                statusCode: 401,
                message: "未登录",
            });
        }

        logger.trace("执行账户绑定操作", JobId);
        const { data, error } = await supabase
            .from("oauth")
            .update({ mcjpgId: id, mcjpgUsername: name })
            .eq("id", user.id)
            .select()
            .single();
        logger.debug(`账户绑定操作完成: ${error ? "失败" : "成功"}`, JobId);

        if (error) {
            logger.fatal("绑定失败", JobId);
            throw createError({
                statusCode: 500,
                message: "绑定失败",
            });
        }

        // 获取更新后的用户信息
        logger.trace("获取更新后的用户信息", JobId);
        const { data: updatedUser_users } = await supabase.from("users").select("id, username, role").eq("id", user.id).single();
        logger.debug("更新后的用户信息获取完成", JobId);

        logger.info("MCJPG 绑定请求处理完成", JobId);
        return {
            message: "绑定成功",
            user: { ...updatedUser_users, ...data },
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