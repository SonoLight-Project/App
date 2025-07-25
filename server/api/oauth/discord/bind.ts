import supabase from "../../../utils/db";
import { defineEventHandler } from "h3";
import { stringify } from "querystring";

export default defineEventHandler(async (event) => {
    const { code } = await readBody(event);

    if (!code) {
        throw createError({
            statusCode: 400,
            message: "缺少授权码",
            data: { errorCode: "DC_OAUTH_BIND:MISSING_AUTH_CODE" },
        });
    }

    // 交换code获取access token
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
    } catch (error: any) {
        switch (error.statusCode) {
            case 400:
                throw createError({
                    statusCode: 400,
                    message: "授权无效：登录已过期，请重试",
                    data: { errorCode: "DC_OAUTH_BIND:TOKEN_EXPIRED" },
                });
            default:
                throw createError({
                    statusCode: 500,
                    message: "授权失败：发生意外错误，请联系管理员",
                    data: { errorCode: "DC_OAUTH_BIND:UNEXPECTED_ERROR", errorDetails: error.message },
                });
        }
    }

    const { access_token } = tokenResponse as { access_token: string };

    // 获取用户信息
    let userInfo;
    try {
        userInfo = await $fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
    } catch (error: any) {
        switch (error.statusCode) {
            case 401:
                throw createError({
                    statusCode: 400,
                    message: "授权无效：登录已过期或无效，请尝试重新登录",
                    data: { errorCode: "DC_OAUTH_BIND:TOKEN_EXPIRED" },
                });
            default:
                throw createError({
                    statusCode: 500,
                    message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                    data: { errorCode: "DC_OAUTH_BIND:UNEXPECTED_ERROR", errorDetails: error.message },
                });
        }
    }

    const { id, username } = userInfo as { id: string; username: string };

    const userId = event.context.auth?.user?.id;
    if (!userId) {
        throw createError({
            statusCode: 401,
            message: "需要先登录",
            data: { errorCode: "DC_OAUTH_BIND:USER_NOT_LOGGED_IN" },
        });
    }

    // 检查是否已被绑定
    const { data: existing } = await supabase.from("users").select("*").eq("discord_id", id).neq("id", userId).single();

    if (existing) {
        throw createError({
            statusCode: 409,
            message: "该 Discord 账户已被其他用户绑定",
            data: { errorCode: "DC_OAUTH_BIND:DISCORD_ACCOUNT_ALREADY_BOUND" },
        });
    }

    // 绑定Discord账户
    await supabase.from("users").update({ discordId: id, discordUsername: username }).eq("id", userId);

    const { data: updatedUser } = await supabase.from("users").select("id, username, role, discordUsername, githubUsername").eq("id", userId).single();

    return { message: "绑定成功", user: updatedUser };
});
