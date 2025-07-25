import supabase from "../../../utils/db";
import { defineEventHandler, setCookie } from "h3";
import { stringify } from "querystring";
import { SignJWT } from "jose/jwt/sign";

export default defineEventHandler(async (event) => {
    const { code } = await readBody(event);

    if (!code) {
        throw createError({ statusCode: 400, message: "缺少授权码" });
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
                    data: { errorCode: "DC_OAUTH_LOGIN:TOKEN_EXPIRED" },
                });
            default:
                throw createError({
                    statusCode: 500,
                    message: "授权失败：发生意外错误，请联系管理",
                    data: { errorCode: "DC_OAUTH_LOGIN:UNEXCEPTED_ERROR", errorDetails: error.message },
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
                    data: { errorCode: "DC_OAUTH_LOGIN:TOKEN_EXPIRED" },
                });
            default:
                throw createError({
                    statusCode: 500,
                    message: "授权无效：获取用户信息时发生意外错误，请联系管理员",
                    data: { errorCode: "DC_OAUTH_LOGIN:UNEXCEPTED_ERROR", errorDetails: error.message },
                });
        }
    }

    const { id } = userInfo as { id: string };

    // 查找Discord ID匹配的用户
    const { data: user } = await supabase.from("users").select("id, username, role, discordUsername, githubUsername").eq("discordId", id).single();

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "未找到关联账户",
            data: { errorCode: "DC_OAUTH_LOGIN:NO_ASSOCIATED_ACCOUNT" },
        });
    }

    // 生成JWT token
    const accessToken = await new SignJWT({ id: user.id, role: user.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    // 生成refresh token
    const refreshToken = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));

    // 保存refresh token到数据库
    await supabase.from("users").update({ refreshToken }).eq("id", user.id);

    // 设置 HTTP-only Cookie
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

    return {
        message: "登录成功",
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            discordUsername: user.discordUsername,
            githubUsername: user.githubUsername,
        },
    };
});
