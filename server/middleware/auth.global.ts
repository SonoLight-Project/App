import { defineEventHandler, getCookie } from "h3"
import { jwtVerify } from 'jose/jwt/verify';


export default defineEventHandler(async (event) => {
    const token = getCookie(event, "accessToken")

    if (!token) return  // 不抛错，只是没有 user

    try {
        const { payload } = await jwtVerify(
  token,
  new TextEncoder().encode(process.env.JWT_SECRET!)
);
const decoded = payload as { id: string, role: string }
        event.context.auth = {
            user: decoded,
        }
    } catch (err) {
        // token 无效则忽略，不设置 user
    }
})
