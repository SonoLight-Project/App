import prisma from "../../utils/prisma";
import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { username, email, password } = body;

    if (!username || !email || !password) {
        throw createError({
            statusCode: 400,
            message: "缺少必填字段",
            data: { errorCode: "REGISTER:MISSING_REQUIRED_FIELDS" },
        });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw createError({
            statusCode: 409,
            message: "邮箱已注册",
            data: { errorCode: "REGISTER:EMAIL_ALREADY_REGISTERED" },
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
        },
        select: {
            id: true,
            username: true,
        },
    });

    return { message: "注册成功" };
});
