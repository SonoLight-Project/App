import supabase from "../../utils/db";
import logger from "../../utils/logging";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose/jwt/sign";
import { setCookie } from "h3";
import { random } from "lodash-es";
import { desensitization } from "../../utils/desensitization";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API Auth/Login #${random(9999)}`);
    logger.info("登录接口开始处理请求", JobId);

    logger.trace("读取请求体数据", JobId);
    const body = await readBody(event);
    const { email, password } = body;
    logger.debug(
        `请求体数据: ${JSON.stringify({ email: email ? desensitization(email) : "[空]", password: password ? desensitization(password) : "[空]" })}`,
        JobId
    );

    logger.trace("验证邮箱和密码是否存在", JobId);
    if (!email || !password) {
        throw createError({
            statusCode: 400,
            message: "缺少邮箱或密码",
            data: { errorCode: "LOGIN:MISSING_EMAIL_OR_PASSWORD" },
        });
    }

    try {
        logger.trace("查询用户基本信息", JobId);
        const { data: user_users } = await supabase.from("users").select("*").eq("email", email).single();

        logger.debug(`用户基本信息查询结果: ${user_users ? "找到用户" : "未找到用户"}`, JobId);

        if (!user_users) {
            logger.warning("用户不存在，邮箱: " + desensitization(email), JobId);
            throw createError({ statusCode: 404, message: "用户不存在", data: { errorCode: "LOGIN:USER_NOT_FOUND" } });
        }

        logger.trace("查询用户 OAuth 信息", JobId);
        const { data: user_oauth } = await supabase.from("oauth").select("*").eq("id", user_users.id).single();

        logger.debug(`用户 OAuth 信息查询结果: ${user_oauth ? "找到 OAuth 记录" : "未找到 OAuth 记录"}`, JobId);

        if (!user_oauth) {
            logger.warning("用户 OAuth 记录不存在，用户 ID: " + user_users.id, JobId);
            throw createError({ statusCode: 404, message: "用户不存在", data: { errorCode: "LOGIN:USER_NOT_FOUND" } });
        }

        logger.trace("验证密码正确性", JobId);
        const isValid = await bcrypt.compare(password, user_users.passwordHash);
        logger.debug(`密码验证结果: ${isValid ? "正确" : "错误"}`, JobId);

        if (!isValid) {
            logger.error("密码错误，邮箱: " + email, JobId);
            throw createError({ statusCode: 401, message: "密码错误", data: { errorCode: "LOGIN:WRONG_PASSWORD" } });
        }

        logger.trace("生成访问令牌 (AccessToken)", JobId);
        const accessToken = await new SignJWT({ id: user_users.id, role: user_users.role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("15m")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        logger.trace("生成刷新令牌 (RefreshToken)", JobId);
        const refreshToken = await new SignJWT({ id: user_users.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));

        logger.trace("保存刷新令牌到数据库", JobId);
        await supabase.from("users").update({ refreshToken }).eq("id", user_users.id);
        logger.debug("刷新令牌已保存到数据库", JobId);

        logger.trace("设置访问令牌 Cookie", JobId);
        setCookie(event, "accessToken", accessToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 15, // 15 m
        });

        logger.trace("设置刷新令牌 Cookie", JobId);
        setCookie(event, "refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 60 * 24 * 7, // 7 d
        });

        logger.info("登录成功，准备返回用户信息", JobId);
        return {
            message: "登录成功",
            user: {
                ...user_users,
                ...user_oauth,
            },
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
