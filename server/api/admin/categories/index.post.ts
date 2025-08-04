import { Params } from "~~/server/modules";
import { supabase } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.Categories.Create");
    logger.info("管理员创建分类接口开始处理请求", JobId);

    try {
        logger.trace("鉴权：获取操作者 ID", JobId);
        const perfUserId = event.context.auth?.user?.id;
        logger.debug(`鉴权：操作者 ID 获取完成: ${perfUserId ? "存在" : "不存在"}`, JobId);
        if (!perfUserId) {
            logger.error("需要先登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "NOT_LOGGED_IN" },
            });
        }

        logger.trace("鉴权：查询操作者信息", JobId);
        const perfUser = await supabase.from("users").select("role").eq("id", perfUserId).single();
        if (!perfUser.data || perfUser.data.role < 8) {
            logger.warning("鉴权：权限不足", JobId);
            throw createError({
                statusCode: 403,
                message: "权限不足",
                data: { errorCode: "OPERATOR_NOT_ADMIN" },
            });
        }

        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { name, description, slug } = body;

        logger.trace("验证必需字段是否存在", JobId);
        Params.verify("缺少必需字段", "MISSING_REQUIRED_FIELDS", name, description, slug);

        // 检查 slug 是否已存在
        const { data: existingCategory, error: existingCategoryError } = await supabase.from("categories").select("id").eq("slug", slug).single();

        if (existingCategory) {
            logger.warning("分类已存在", JobId);
            throw createError({
                statusCode: 409,
                message: "分类已存在",
                data: { errorCode: "CATEGORY_ALREADY_EXISTS" },
            });
        }

        // 创建新分类
        logger.trace("执行数据库插入操作", JobId);
        const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .insert({
                name,
                description,
                slug,
            })
            .select()
            .single();

        if (categoryError) {
            logger.error(`创建分类失败: ${categoryError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "创建分类失败",
                data: { errorCode: "CREATE_CATEGORY_FAILED" },
            });
        }

        logger.info("分类创建成功", JobId);
        return {
            message: "分类创建成功",
            category: categoryData,
        };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
