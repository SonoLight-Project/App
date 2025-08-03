<script lang="ts" setup>
    import { ref } from "vue";
    import { PAAuth } from "~/modules/api";
    import { EventBus } from "~/modules/Eventbus";
    import { wrapRequestErrorMessage } from "~/utils/PublicFunction";

    const username = ref("");
    const email = ref("");
    const password = ref("");
    const loading = ref(false);

    const register = async () => {
        loading.value = true;
        const [success, err] = await PAAuth.Register(username.value, email.value, password.value);
        if (success) {
            await navigateTo("/account/login");
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "注册成功，请登录",
            });
        }
        if (err) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(err, "注册失败，请重试"),
            });
        }
        loading.value = false;
    };
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-3/4 md:w-1/3 py-2">
            <h2 class="text-xl mx-auto">声致发光平台 · 注册</h2>
        </div>

        <div class="card lg:card-side bg-base-100 shadow-sm w-3/4 md:w-1/3">
            <div class="card-body">
                <fieldset class="fieldset">
                    <legend class="fieldset-legend">用户名<span class="text-error -ml-1">*</span></legend>
                    <input v-model="username" class="input w-full" placeholder="请输入用户名" type="text" />
                </fieldset>

                <fieldset class="fieldset">
                    <legend class="fieldset-legend">邮箱<span class="text-error -ml-1">*</span></legend>
                    <input v-model="email" class="input w-full" placeholder="请输入邮箱" type="email" />
                </fieldset>

                <fieldset class="fieldset">
                    <legend class="fieldset-legend">密码<span class="text-error -ml-1">*</span></legend>
                    <input v-model="password" class="input w-full" placeholder="请输入密码" type="password" />
                </fieldset>

                <fieldset class="fieldset">
                    <label class="label">
                        已有账户？
                        <NuxtLink class="-ml-1 underline cursor-pointer" href="/account/login">立即登录</NuxtLink>
                    </label>
                </fieldset>

                <fieldset class="fieldset">
                    <button :disabled="loading" class="join-item btn btn-primary" @click="register">
                        {{ loading ? "注册中..." : "注册" }}
                    </button>
                </fieldset>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped></style>
