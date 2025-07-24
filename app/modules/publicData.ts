export const DISCORD_OAUTH_URI =
    "https://discord.com/oauth2/authorize?client_id=1396193252138549248&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Faccount%2Foauth-redirect%2Fdiscord&scope=identify";

export const GITHUB_OAUTH_URI =
    "https://github.com/login/oauth/authorize?client_id=Ov23liGnvXbFkUAOcQ3l&redirect_uri=http://localhost:3000/account/oauth-redirect/github&scope=user";

export const identityMapper: { [key: number]: string } = {
    0: "普通用户",
    1: "认证用户",
    2: "萌新创作者",
    3: "入门创作者",
    4: "优质创作者",
    5: "核心创作者",
    6: "专业创作者",
    7: "顶尖创作者",
    8: "管理员",
    9: "超级管理员",
}
