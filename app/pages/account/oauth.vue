<script lang="ts" setup>
    const $window = window;

    const oauth_urls = {
        "discord": "https://discord.com/oauth2/authorize?client_id=1396193252138549248&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Faccount%2Foauth-redirect%2Fdiscord&scope=identify",
        "github": "https://github.com/login/oauth/authorize?client_id=Ov23liGnvXbFkUAOcQ3l&redirect_uri=http://localhost:3000/account/oauth-redirect/github&scope=user&state=a28eeba6-abe9-492d-8174-87c01078ab82"
        }
</script>

<template>
    <main class="w-full h-21/24 flex flex-col justify-center items-center gap-2">
        <div class="card bg-base-100 shadow-sm w-1/3 py-2">
            <h2 class="text-xl mx-auto">声致发光平台 · 第三方登录</h2>
        </div>
        <div class="card lg:card-side bg-base-100 shadow-sm w-1/3">
            <div class="card-body">
                <button class="btn bg-[#5865F2] border-[#5865F2] text-white" @click="$window.location.href = oauth_urls['discord']">
                    <Icon class="mr-1" name="ic:round-discord" size="18" />
                    <span class=""> Login with Discord (Dev Redirect URL) </span>
                </button>
                <button class="btn bg-[#171515] border-[#171515] text-white" @click="$window.location.href = oauth_urls['github']">
                    <Icon class="mr-1" name="octicon:mark-github-16" size="18" />
                    <span class=""> Login with GitHub (Dev Redirect URL) </span>
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
