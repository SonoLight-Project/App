import { defineEventHandler, getCookie } from "h3"
import jwt from "jsonwebtoken"

export default defineEventHandler(async (event) => {
    const token = getCookie(event, "accessToken")

    if (!token) return  // 不抛错，只是没有 user

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        event.context.auth = {
            user: decoded,
        }
    } catch (err) {
        // token 无效则忽略，不设置 user
    }
})
