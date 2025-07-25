import supabase from "../../utils/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose/jwt/sign";

import { setCookie } from "h3";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, password } = body;

    if (!email || !password) {
        throw createError({
            statusCode: 400,
            message: "缺少邮箱或密码",
            data: { errorCode: "LOGIN:MISSING_EMAIL_OR_PASSWORD" },
        });
    }

    const { data: user } = await supabase.from("users").select("*").eq("email", email).single();

    if (!user) {
        throw createError({ statusCode: 401, message: "用户不存在", data: { errorCode: "LOGIN:USER_NOT_FOUND" } });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
        throw createError({ statusCode: 401, message: "密码错误", data: { errorCode: "LOGIN:WRONG_PASSWORD" } });
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
