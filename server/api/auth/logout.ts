import prisma from "../../utils/prisma";
import { defineEventHandler, setCookie } from "h3";

export default defineEventHandler(async (event) => {
    const userId = event.context.auth?.user?.id;

    if (!userId) {
        throw createError({
            statusCode: 400,
            message: "用户未登录",
            data: { errorCode: "LOGOUT:USER_NOT_LOGGED_IN" }
        });
    }

    // 清除数据库中的refresh token
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });

    // 清除客户端cookies
    setCookie(event, "accessToken", "", { maxAge: 0 });
    setCookie(event, "refreshToken", "", { maxAge: 0 });

    return { message: "注销成功" };
});
