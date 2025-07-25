<script lang="ts" setup>
    import { ref } from "vue";
    import { EventBus } from "~/modules/Eventbus";
    import { useAccountStore } from "~/stores/account";
    import type { IApiUserResponse } from "~/types/api/LoginType";
    import { wrapRequestErrorMessage } from "~/modules/publicFunction";

    const accountStore = useAccountStore();

    const email = ref("");
    const password = ref("");
    const loading = ref(false);

    const login = async () => {
        loading.value = true;

        try {
            const res = await $fetch("/api/auth/login", {
                method: "POST",
                body: {
                    email: email.value,
                    password: password.value,
                },
            });

            const _u = res.user as IApiUserResponse;
            accountStore.setUser(_u["id"], _u["username"], _u["role"], _u["discordUsername"], _u["githubUsername"]);

            // 跳转到面板
            await navigateTo("/dashboard");

            EventBus.emit("toast:create", {
                alertType: "success",
                content: "登录成功",
            });
        } catch (err: any) {
            // 登录失败，展示错误信息
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(err, "登录失败，请重试"),
            });
        } finally {
            loading.value = false;
        }
    };
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-2">
            <h2 class="text-xl mx-auto">声致发光平台 · 登录</h2>
        </div>
        <div class="card lg:card-side bg-base-100 shadow-sm w-3/4 md:w-1/3">
            <div class="card-body">
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">邮箱<span class="text-error -ml-1">*</span></legend>
                    <input v-model="email" class="input w-full" placeholder="请输入邮箱" type="email" />
                </fieldset>
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">密码<span class="text-error -ml-1">*</span></legend>
                    <input v-model="password" class="input w-full" placeholder="请输入密码" type="password" />
                </fieldset>
                <fieldset class="fieldset">
                    <label class="label"
                        >还没有账户？
                        <a class="-ml-1 underline cursor-pointer" @click.prevent="$router.push('/account/register')">立即注册</a>
                    </label>
                </fieldset>
                <fieldset class="fieldset">
                    <button :disabled="loading" class="join-item btn btn-primary" @click="login">
                        {{ loading ? "登录中..." : "登录" }}
                    </button>
                </fieldset>
                <div class="divider my-0"></div>
                <fieldset class="fieldset">
                    <button class="join-item btn btn-primary" @click="$router.push('/account/oauth')">使用第三方账户登录</button>
                </fieldset>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped></style>
