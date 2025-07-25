import supabase from "../../../utils/db";
import { defineEventHandler, setCookie } from "h3";
import { SignJWT } from "jose/jwt/sign";

export default defineEventHandler(async (event) => {
    const { code } = await readBody(event);

    if (!code) {
        throw createError({
            statusCode: 400,
            message: "缺少授权码",
            data: { errorCode: "GH_OAUTH_LOGIN:MISSING_AUTH_CODE" },
        });
    }

    // 交换code获取access token
    const tokenResponse = await $fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        params: {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
        },
        headers: {
            Accept: "application/json",
        },
    });

    const { access_token } = (tokenResponse as { access_token: string }) ?? {};

    // 获取用户信息
    const userInfo = await $fetch("https://api.github.com/user", {
        headers: {
            Authorization: `token ${ access_token }`,
        },
    });

    const { id } = userInfo as { id: number };

    // 查找GitHub ID匹配的用户
    const { data: user } = await supabase.from("users").select("id, username, role, discordUsername, githubUsername").eq("githubId", id.toString()).single();

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "未找到关联账户",
            data: { errorCode: "GH_OAUTH_LOGIN:NO_ASSOCIATED_ACCOUNT" },
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
