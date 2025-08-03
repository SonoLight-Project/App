import { SignJWT } from "jose/jwt/sign";

export const signAccessToken = (JobId: number, User: { id: any; role: any }) => {
    logger.trace("生成访问令牌 (AccessToken)", JobId);
    return new SignJWT({ id: User.id, role: User.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
};

export const signRefreshTokenAndSave = async (JobId: number, User: { id: any; role: any }) => {
    logger.trace("生成刷新令牌 (RefreshToken)", JobId);
    const refreshToken = await new SignJWT({ id: User.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!));

    logger.trace("保存刷新令牌到数据库", JobId);
    await supabase.from("users").update({ refreshToken }).eq("id", User.id);
    logger.debug("刷新令牌已保存到数据库", JobId);

    return refreshToken;
};
