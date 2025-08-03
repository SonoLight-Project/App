<script lang="ts" setup>
    import { EventBus } from "~/modules/Eventbus";
    import { OAuth } from "~/modules/api";
    import { useOAuthStore } from "~/stores/oauth";

    const $route = useRoute();
    const oauthStore = useOAuthStore();
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
        const platform = route.params.platform as string;
        const code = route.query.code as string;
        const state = route.query.state as string;

        if (!code) {
            error.value = "缺少授权码";
            return;
        }

        isLoading.value = true;

        const [success, err] = await OAuth.Login(platform, code, state);
        if (success) {
            if (oauthStore.action === "login") {
                navigateTo("/explore");
            } else if (oauthStore.action === "bind") {
                navigateTo("/settings/account");
            }
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "授权成功",
            });
        }
        if (err) {
            error.value = wrapRequestErrorMessage(err, "授权处理失败，请联系管理员");
        }
        isLoading.value = false;
        oauthStore.setOperation(false);
    });
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-2">
            <h2 class="text-xl mx-auto hidden lg:block">声致发光平台 · {{ mapper[$route.params.platform as string] }} 授权</h2>
            <h2 class="text-xl mx-auto lg:hidden">声致发光平台</h2>
            <h2 class="text-xl mx-auto lg:hidden">{{ mapper[$route.params.platform as string] }} 授权</h2>
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
