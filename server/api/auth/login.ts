import prisma from "../../utils/prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { setCookie } from "h3"

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
        throw createError({ statusCode: 400, message: "缺少邮箱或密码" })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        throw createError({ statusCode: 401, message: "用户不存在" })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
        throw createError({ statusCode: 401, message: "密码错误" })
    }

    // 生成JWT token
    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
    )

    // 生成refresh token
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" }
    )

    // 保存refresh token到数据库
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
    })

    // 设置 HTTP-only Cookie
    setCookie(event, "accessToken", accessToken, {
        httpOnly: true,
        sameSite: true,
        maxAge: 60 * 15, // 15 m
    })

    setCookie(event, "refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: true,
        maxAge: 60 * 60 * 24 * 7 // 7 d
    })

    return {
        message: "登录成功",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        }
    }
})
