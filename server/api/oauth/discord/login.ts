import prisma from "../../../utils/prisma";
import { defineEventHandler, setCookie } from "h3";
import { stringify } from "querystring";
import jwt from "jsonwebtoken";

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
                throw createError({ statusCode: 400, message: "授权无效：登录已过期，请重试" });
            default:
                throw createError({ statusCode: 500, message: "授权失败：发生意外错误，请联系管理员" });
        }
    }

    const { access_token } = tokenResponse as { access_token: string };

    // 获取用户信息
    let userInfo
    try {
        userInfo = await $fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${ access_token }`,
            },
        });
    } catch (error: any) {
        switch (error.statusCode) {
            case 401:
                throw createError({ statusCode: 400, message: "授权无效：登录已过期或无效，请尝试重新登录" });
            default:
                throw createError({ statusCode: 500, message: "授权无效：获取用户信息时发生意外错误，请联系管理员" })
        }
    }

    const { id, username } = userInfo as { id: string; username: string };

    // 查找Discord ID匹配的用户
    const user = await prisma.user.findUnique({
        where: { discordId: id },
        select: { id: true, username: true, email: true, discordUsername: true },
    });

    if (!user) {
        throw createError({ statusCode: 401, message: "未找到关联账户" });
    }

    // 生成JWT token
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            discordUsername: user.discordUsername,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
    );

    // 生成refresh token
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

    // 保存refresh token到数据库
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

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
            email: user.email,
            discordUsername: username,
        },
    };
});