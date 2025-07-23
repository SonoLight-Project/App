<script lang="ts" setup>
    import * as Std from "~/modules/staticData";

    const oauthStore = useOAuthStore();

    const oauthUri = {
        discord: Std.DISCORD_OAUTH_URI,
        github: Std.GITHUB_OAUTH_URI,
    };

    const startOAuthLogin = (platform: "discord" | "github") => {
        oauthStore.setAction("login");
        window.location.href = oauthUri[platform];
    };
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-2">
            <h2 class="text-xl mx-auto">声致发光平台 · 第三方登录</h2>
        </div>
        <div class="card lg:card-side bg-base-100 shadow-sm w-3/4 md:w-1/3">
            <div class="card-body">
                <button class="btn bg-[#5865F2] border-[#5865F2] text-white" @click="startOAuthLogin('discord')">
                    <Icon class="mr-1" name="ic:round-discord" size="18" />
                    <span class="">Login with Discord (Dev Redirect URL) </span>
                </button>
                <button class="btn bg-[#171515] border-[#171515] text-white" @click="startOAuthLogin('github')">
                    <Icon class="mr-1" name="octicon:mark-github-16" size="18" />
                    <span class="">Login with GitHub (Dev Redirect URL) </span>
                </button>
                <div class="divider my-0"></div>
                <fieldset class="fieldset">
                    <button class="join-item btn btn-primary" @click="$router.push('/account/login')">使用统一账户登录</button>
                </fieldset>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped></style>
