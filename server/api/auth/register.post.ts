import bcrypt from "bcryptjs";
import { Params } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`Api.Auth.Register`);
    logger.info("注册接口开始处理请求", JobId);

    try {
        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { username, email, password } = body;
        logger.debug(
            `请求体数据: ${JSON.stringify({
                username: desensitization(username) ?? "[空]",
                email: desensitization(email) ?? "[空]",
                password: desensitization(password) ?? "[空]",
            })}`,
            JobId
        );

        logger.trace("验证必填字段是否存在", JobId);
        Params.verify("缺少必填字段", "MISSING_REQUIRED_FIELDS", username, email, password);

        logger.trace("检查邮箱是否已注册", JobId);
        const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single();
        logger.debug(`邮箱检查结果: ${existingUser ? "已存在" : "未注册"}`, JobId);

        if (existingUser) {
            logger.warning("邮箱已注册: " + desensitization(email), JobId);
            throw createError({
                statusCode: 409,
                message: "邮箱已注册",
                data: { errorCode: "EMAIL_ALREADY_REGISTERED" },
            });
        }

        logger.trace("对密码进行哈希处理", JobId);
        const passwordHash = await bcrypt.hash(password, 10);
        logger.debug("密码哈希处理完成", JobId);

        logger.trace("创建新用户", JobId);
        const { error: insertError } = await supabase.from("users").insert([
            {
                username,
                email,
                passwordHash,
            },
        ]);
        if (insertError) {
            logger.error(`数据库插入用户失败: ${insertError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "用户注册失败",
                data: { errorCode: "USER_REGISTRATION_FAILED" },
            });
        }
        logger.debug("用户数据已插入数据库", JobId);

        logger.trace("查询新创建用户的 ID", JobId);
        const { data: user } = await supabase.from("users").select("id").eq("username", username).single();
        if (!user) {
            logger.error("查询新创建用户失败: " + desensitization(username), JobId);
            throw createError({
                statusCode: 500,
                message: "用户注册失败",
                data: { errorCode: "USER_REGISTRATION_FAILED" },
            });
        }
        logger.debug(`查询到新用户 ID: ${user.id}`, JobId);

        logger.trace("创建用户 OAuth 记录", JobId);
        const { error: oauthInsertError } = await supabase.from("oauth").insert([{ id: user.id }]);
        if (oauthInsertError) {
            logger.error(`创建用户 OAuth 记录失败: ${oauthInsertError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "用户注册失败",
                data: { errorCode: "USER_REGISTRATION_FAILED" },
            });
        }
        logger.debug("用户 OAuth 记录已创建", JobId);

        logger.info("用户注册成功: " + desensitization(username), JobId);
        return { message: "注册成功，请登录" };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
