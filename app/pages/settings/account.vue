<script lang="ts" setup>
    import { useRouter } from "vue-router";
    import { useOAuthStore } from "@/stores/oauth";
    import { EventBus } from "~/modules/Eventbus";
    import type { IApiUserResponse } from "~/types/api/LoginType";
    import { wrapRequestErrorMessage } from "~/modules/publicFunction";

    const router = useRouter();
    const accountStore = useAccountStore();
    const oauthStore = useOAuthStore();
    const confirm_modal = ref<HTMLDialogElement | null>(null);
    const confirm_platform = ref<string | null>(null);

    // 检查用户是否已登录
    if (!accountStore.userId) {
        router.push("/account/login");
    }

    const avatarName = computed(() => {
        const name = accountStore.userName?.trim();
        if (!name) return;

        const stringWrapper = (t: string) => t.charAt(0).toUpperCase();

        const parts = name.split(/\s+/); // 支持多个空格间隔
        if (parts.length >= 2) {
            return stringWrapper(parts[0]!) + stringWrapper(parts[1]!);
        }
        return stringWrapper(parts[0]!);
    });

    // 绑定OAuth账户
    const bindOAuth = async (platform: "github" | "discord" | "mcjpg") => {
        oauthStore.setOperation(true);
        oauthStore.setAction("bind");
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

    // 解绑OAuth账户
    const ensureUnbindOAuth = async (platform: "github" | "discord" | "mcjpg") => {
        confirm_platform.value = { github: "GitHub", discord: "Discord", mcjpg: "MCJPG" }[platform];
        confirm_modal.value?.show();
    };

    const unbindOAuth = async () => {
        oauthStore.setOperation(true);
        try {
            const res = await $fetch(`/api/oauth/${confirm_platform.value?.toLowerCase()}/unbind`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const _u = (res as unknown as { user: IApiUserResponse }).user;
            accountStore.setUser(_u["id"], _u["username"], _u["role"], _u["discordUsername"], _u["githubUsername"], _u["mcjpgUsername"]);

            EventBus.emit("toast:create", {
                alertType: "success",
                content: `${confirm_platform.value} 账户解绑成功`,
            });
        } catch (error) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: `${confirm_platform.value} 解绑失败`,
            });
        } finally {
            oauthStore.setOperation(false);
        }
    };
</script>

<template>
    <main class="w-full h-full flex flex-col items-center gap-4 px-4 py-8">
        <!-- 页面标题和面包屑 -->
        <div class="w-full">
            <div class="card bg-base-100 shadow-sm w-full mt-12">
                <div class="breadcrumbs text-base ml-4">
                    <ul>
                        <li><a @click="router.push('/dashboard')">面板</a></li>
                        <li><a @click="router.push('/settings')">设置</a></li>
                        <li>账户设置</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="w-full space-y-4">
            <!-- 用户基本信息卡片 -->
            <div class="card bg-base-100 shadow-md overflow-hidden">
                <div class="card-body">
                    <h2 class="card-title text-xl">个人信息</h2>
                    <div class="flex items-center space-x-4 mt-4">
                        <div class="avatar avatar-online avatar-placeholder scale-110 ml-4" role="button" tabindex="0">
                            <div class="bg-neutral text-neutral-content w-10 rounded-full">
                                <span class="-translate-x-[0.5px]">{{ avatarName }}</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">用户名</p>
                            <p class="text-lg font-medium">{{ accountStore.userName || "未设置" }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- OAuth 连接状态卡片 -->
            <div class="collapse collapse-arrow bg-base-100">
                <input type="checkbox" />
                <div id="oauth" class="collapse-title font-semibold">
                    <h2 class="card-title text-xl">第三方账户连接</h2>
                    <p class="text-gray-500">管理您的社交媒体账户连接</p>
                </div>
                <div class="collapse-content text-sm">
                    <!-- Discord 连接 -->
                    <div class="flex items-center justify-between p-4 border rounded-lg mb-4 hover:bg-base-200 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 rounded-full bg-[#5865F2]/50 flex items-center justify-center">
                                <Icon name="ic:round-discord" size="24" />
                            </div>
                            <div>
                                <h3 class="text-lg font-medium">Discord</h3>
                                <p class="text-sm text-gray-500">
                                    {{ accountStore.discordUsername ? `已绑定 @${accountStore.discordUsername}` : "未绑定" }}
                                </p>
                            </div>
                        </div>
                        <div>
                            <button
                                :class="accountStore.discordUsername ? 'btn-error' : 'btn-success'"
                                :disabled="oauthStore.in_operation"
                                class="btn btn-sm"
                                @click="accountStore.discordUsername ? ensureUnbindOAuth('discord') : bindOAuth('discord')">
                                {{ accountStore.discordUsername ? "解除绑定" : "绑定账户" }}
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between p-4 border rounded-lg mb-4 hover:bg-base-200 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 rounded-full bg-[#171515]/50 flex items-center justify-center">
                                <Icon name="octicon:mark-github-24" size="24" />
                            </div>
                            <div>
                                <h3 class="text-lg font-medium">GitHub</h3>
                                <p class="text-sm text-gray-500">
                                    {{ accountStore.githubUsername ? `已绑定 ${accountStore.githubUsername}` : "未绑定" }}
                                </p>
                            </div>
                        </div>
                        <div>
                            <button
                                :class="accountStore.githubUsername ? 'btn-error' : 'btn-success'"
                                :disabled="oauthStore.in_operation"
                                class="btn btn-sm"
                                @click="accountStore.githubUsername ? ensureUnbindOAuth('github') : bindOAuth('github')">
                                {{ accountStore.githubUsername ? "解除绑定" : "绑定账户" }}
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-base-200 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 rounded-full bg-[#FFAC38]/50 flex items-center justify-center">
                                <img src="https://mcjpg.org/logo.png" class="w-7 h-7" />
                            </div>
                            <div>
                                <h3 class="text-lg font-medium">MCJPG</h3>
                                <p class="text-sm text-gray-500">
                                    {{ accountStore.mcjpgUsername ? `已绑定 ${accountStore.mcjpgUsername}` : "未绑定" }}
                                </p>
                            </div>
                        </div>
                        <div>
                            <button
                                :class="accountStore.mcjpgUsername ? 'btn-error' : 'btn-success'"
                                :disabled="oauthStore.in_operation"
                                class="btn btn-sm"
                                @click="accountStore.mcjpgUsername ? ensureUnbindOAuth('mcjpg') : bindOAuth('mcjpg')">
                                {{ accountStore.mcjpgUsername ? "解除绑定" : "绑定账户" }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <dialog ref="confirm_modal" class="modal">
            <div class="modal-box shadow-[0_0_6px_0_var(--color-error)]">
                <h3 class="text-lg text-error font-bold">操作确认</h3>
                <p class="py-4">确定要解绑您的 {{ confirm_platform }} 账户吗？</p>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-error btn-outline mr-4" @click="unbindOAuth()">确认</button>
                        <button class="btn btn-outline">取消</button>
                    </form>
                </div>
            </div>
        </dialog>
    </main>
</template>

<style lang="scss" scoped>
    .collapse-arrow {
        .collapse-title#oauth:after {
            margin-top: 14px;
            margin-right: 4px;
            scale: 1.2;
        }
    }
</style>
