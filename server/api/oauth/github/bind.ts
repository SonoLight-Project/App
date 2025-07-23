import prisma from "../../../utils/prisma";
import { defineEventHandler } from "h3";

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

    const userId = event.context.auth?.user?.id;
    if (!userId) {
        throw createError({ statusCode: 401, message: "需要先登录" });
    }

    // 检查是否已被绑定
    const existing = await prisma.user.findFirst({
        where: { githubId: id.toString(), NOT: { id: userId } },
    });

    if (existing) {
        throw createError({ statusCode: 409, message: "该 GitHub 账户已被其他用户绑定" });
    }

    // 绑定GitHub账户
    await prisma.user.update({
        where: { id: userId },
        data: {
            githubId: id.toString(),
            githubUsername: login,
        },
    });

    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            discordUsername: true,
            githubUsername: true
        }
    });

    return { message: "绑定成功", user: updatedUser };
});