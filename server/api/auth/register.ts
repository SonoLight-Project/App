import supabase from "../../utils/db";
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

    const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single();
    if (existingUser) {
        throw createError({
            statusCode: 409,
            message: "邮箱已注册",
            data: { errorCode: "REGISTER:EMAIL_ALREADY_REGISTERED" },
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await supabase.from("users").insert([
        {
            username,
            email,
            passwordHash,
        },
    ]);

    return { message: "注册成功" };
});
