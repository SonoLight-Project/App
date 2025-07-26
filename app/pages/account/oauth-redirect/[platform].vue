<script lang="ts" setup>
    import { useOAuthStore } from "~/stores/oauth";
    import { useAccountStore } from "~/stores/account";
    import type { IApiUserResponse } from "~/types/api/LoginType";
    import { wrapRequestErrorMessage } from "~/modules/publicFunction";
    import { EventBus } from "~/modules/Eventbus";

    const $route = useRoute();
    const oauthStore = useOAuthStore();
    const accountStore = useAccountStore();
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const mapper: Record<string, any> = {
        github: "GitHub",
        discord: "Discord",
        mcjpg: "MCJPG 通行证",
    };

    onMounted(async () => {
        if (process.server) return;

        const route = useRoute();
        const code = route.query.code as string;
        const state = route.query.state as string;
        const platform = route.params.platform as string;

        if (!code) {
            error.value = "缺少授权码";
            return;
        }

        isLoading.value = true;

        try {
            // @ts-ignore
            const res: {
                message: string;
                user: IApiUserResponse;
            } = await $fetch(`/api/oauth/${platform}/${oauthStore.action}`, {
                method: "POST",
                body: {
                    code,
                    state,
                },
            });

            const _u = res.user as IApiUserResponse;
            accountStore.setUser(_u["id"], _u["username"], _u["role"], _u["discordUsername"], _u["githubUsername"], _u["mcjpgUsername"]);

            if (oauthStore.action === "login") {
                navigateTo("/dashboard");
            } else if (oauthStore.action === "bind") {
                navigateTo("/settings/account");
            }

            EventBus.emit("toast:create", {
                alertType: "success",
                content: "授权成功",
            });
        } catch (err: any) {
            error.value = wrapRequestErrorMessage(err, "授权处理失败，请联系管理员");
        } finally {
            isLoading.value = false;
            oauthStore.setOperation(false);
        }
    });
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-2">
            <h2 class="text-xl mx-auto">声致发光平台 · {{ mapper[$route.params.platform as string] }} 授权</h2>
        </div>

        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-4 px-6 flex flex-col gap-4">
            <div v-if="isLoading" class="flex flex-col items-center gap-2">
                <span class="loading loading-spinner text-primary"></span>
                <p>正在处理 {{ mapper[$route.params.platform as string] }} 授权...</p>
            </div>

            <div v-if="error" class="alert alert-error">
                <svg class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2" />
                </svg>
                <span>{{ error }}</span>
            </div>

            <div v-if="error" class="w-full flex gap-2">
                <button class="btn btn-primary w-full" @click="$router.push(oauthStore.action === 'login' ? '/account/login' : '/settings/account')">
                    返回
                </button>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped></style>
