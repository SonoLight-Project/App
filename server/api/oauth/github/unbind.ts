import prisma from "../../../utils/prisma";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    const userId = event.context.auth?.user?.id;
    if (!userId) {
        throw createError({ statusCode: 401, message: "需要先登录" });
    }

    // 解绑GitHub账户
    await prisma.user.update({
        where: { id: userId },
        data: {
            githubId: null,
            githubUsername: null,
        },
    });

    return { message: "解绑成功" };
});