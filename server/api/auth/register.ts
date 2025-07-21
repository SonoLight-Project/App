import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { username, email, password } = body

    if (!username || !email || !password) {
        throw createError({ statusCode: 400, message: '缺少必填字段' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        throw createError({ statusCode: 409, message: '邮箱已注册' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
        },
        select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
        }
    })

    return { message: '注册成功', user }
})
