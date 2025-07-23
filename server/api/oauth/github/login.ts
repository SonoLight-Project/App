import prisma from "../../../utils/prisma";
import { defineEventHandler, setCookie } from "h3";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
    const { code } = await readBody(event);

    if (!code) {
        throw createError({ statusCode: 400, message: "缺少授权码" });
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

    const { access_token } = tokenResponse as { access_token: string } ?? {};

    // 获取用户信息
    const userInfo = await $fetch("https://api.github.com/user", {
        headers: {
            Authorization: `token ${access_token}`,
        },
    });

    const { id, login } = userInfo as { id: number; login: string };

    // 查找GitHub ID匹配的用户
    const user = await prisma.user.findUnique({
        where: { githubId: id.toString() },
        select: { id: true, username: true, discordUsername: true, githubUsername: true },
    });

    if (!user) {
        throw createError({ statusCode: 401, message: "未找到关联账户" });
    }

    // 生成JWT token
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            githubUsername: login
        },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
    );

    // 生成refresh token
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

    // 保存refresh token到数据库
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
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
        maxAge: 60 * 60 * 24 * 7 // 7 d
    });

    return {
        message: "登录成功",
        user: {
            id: user.id,
            username: user.username,
            discordUsername: user.discordUsername,
            githubUsername: user.githubUsername,
        }
    };
});