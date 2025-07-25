import prisma from "../../utils/prisma";
import jwt from "jsonwebtoken";
import { defineEventHandler, getCookie, setCookie } from "h3";

export default defineEventHandler(async (event) => {
    // 从Cookie中获取refreshToken
    const refreshToken = getCookie(event, "refreshToken");

    if (!refreshToken) {
        throw createError({
            statusCode: 401,
            message: "未提供 refreshToken",
            data: { errorCode: "REFRESH:MISSING_TOKEN" }
        });
    }

    try {
        // 验证refreshToken
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };

        // 查询用户并验证refreshToken
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user || user.refreshToken !== refreshToken) {
            throw createError({
                statusCode: 401,
                message: "refreshToken 无效或已过期",
                data: { errorCode: "REFRESH:INVALID_TOKEN" }
            });
        }

        // 生成新的accessToken
        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "15m" }
        );

        // 设置新的accessToken到Cookie
        setCookie(event, "accessToken", accessToken, {
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 15 // 15分钟
        });

        const updatedUser = {
            id: user.id,
            username: user.username,
            role: user.role,
            discordUsername: user.discordUsername,
            githubUsername: user.githubUsername,
        }

        return { message: "已刷新 AccessToken", user: updatedUser };
    } catch (error: any) {
        // 重投
        if (error.data.data.errorCode === "REFRESH:INVALID_TOKEN") throw error;

        if (error.name === "TokenExpiredError") {
            throw createError({
                statusCode: 401,
                message: "refreshToken 已过期，请重新登录",
                data: { errorCode: "REFRESH:TOKEN_EXPIRED" }
            });
        }

        throw createError({
            statusCode: 401,
            message: "refreshToken 验证失败",
            data: { errorCode: "REFRESH:VERIFICATION_FAILED" }
        });
    }
});