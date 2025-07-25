import supabase from "../../../utils/db";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
    const userId = event.context.auth?.user?.id;

    if (!userId) {
        throw createError({
            statusCode: 401,
            message: "需要先登录",
            data: { errorCode: "DC_OAUTH_UNBIND:USER_NOT_LOGGED_IN" },
        });
    }

    // 解绑Discord账户
    await supabase
        .from("users")
        .update({
            discordId: null,
            discordUsername: null,
        })
        .eq("id", userId);

    const { data: updatedUser } = await supabase.from("users").select("id, username, role, discordUsername, githubUsername").eq("id", userId).single();

    return { message: "解绑成功", user: updatedUser };
});
