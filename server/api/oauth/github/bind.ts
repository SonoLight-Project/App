import supabase from "../../../utils/db";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    const { code } = await readBody(event);

    if (!code) {
        throw createError({
            statusCode: 400,
            message: "缺少授权码",
            data: { errorCode: "GH_OAUTH_BIND:MISSING_AUTH_CODE" },
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

    const { id, login } = userInfo as { id: number; login: string };

    const userId = event.context.auth?.user?.id;
    if (!userId) {
        throw createError({
            statusCode: 401,
            message: "需要先登录",
            data: { errorCode: "GH_OAUTH_BIND:USER_NOT_LOGGED_IN" },
        });
    }

    // 检查是否已被绑定
    const { data: existing } = await supabase.from("users").select("*").eq("github_id", id.toString()).neq("id", userId).single();

    if (existing) {
        throw createError({
            statusCode: 409,
            message: "该 GitHub 账户已被其他用户绑定",
            data: { errorCode: "GH_OAUTH_BIND:GITHUB_ACCOUNT_ALREADY_BOUND" },
        });
    }

    // 绑定GitHub账户
    await supabase.from("users").update({ githubId: id.toString(), githubUsername: login }).eq("id", userId);

    const { data: updatedUser } = await supabase.from("users").select("id, username, role, discordUsername, githubUsername").eq("id", userId).single();

    return { message: "绑定成功", user: updatedUser };
});
