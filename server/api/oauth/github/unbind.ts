import prisma from "../../../utils/prisma";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    const userId = event.context.auth?.user?.id;
    if (!userId) {
        throw createError({
            statusCode: 401,
            message: "需要先登录",
            data: { errorCode: "GH_OAUTH_UNBIND:USER_NOT_LOGGED_IN" },
        });
    }

    // 解绑GitHub账户
    await prisma.user.update({
        where: { id: userId },
        data: {
            githubId: null,
            githubUsername: null,
        },
    });

    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            role: true,
            discordUsername: true,
            githubUsername: true,
        },
    });

    return { message: "解绑成功", user: updatedUser };
});
