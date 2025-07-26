<script lang="ts" setup>
    import { EventBus } from "~/modules/Eventbus";
    import { wrapRequestErrorMessage } from "~/modules/publicFunction";

    const oauthStore = useOAuthStore();

    const startOAuthLogin = async (platform: "discord" | "github" | "mcjpg") => {
        oauthStore.setAction("login");
        try {
            const uri = await $fetch("/api/oauth/query", {
                method: "GET",
                query: {
                    platform,
                },
            });
            if (!uri) {
                EventBus.emit("toast:create", {
                    alertType: "error",
                    content: "获取授权链接失败",
                });
                return;
            }
            window.location.href = uri;
        } catch (error) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "获取授权链接失败"),
            });
            oauthStore.setOperation(false);
            return;
        }
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
                    <span class="">用 Discord 登录</span>
                </button>
                <button class="btn bg-[#171515] border-[#171515] text-white" @click="startOAuthLogin('github')">
                    <Icon class="mr-1" name="octicon:mark-github-16" size="18" />
                    <span class="">用 GitHub 登录</span>
                </button>
                <button class="btn bg-[#FFAC38] border-[#FFAC38] text-black" @click="startOAuthLogin('mcjpg')">
                    <!-- <Icon class="mr-1" name="octicon:mark-github-16" size="18" /> -->
                    <img src="https://mcjpg.org/logo.png" class="w-4.5 h-4.5 mr-1" />
                    <span class="">用 MCJPG 通行证登录</span>
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
