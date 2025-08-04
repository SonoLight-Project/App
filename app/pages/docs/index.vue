<script setup lang="ts">
    const $$account = useAccountStore();
</script>

<template>
    <main class="w-full h-full">
        <section class="w-full py-16 flex flex-row justify-around items-center bg-base-300">
            <div>
                <h1 class="ui-font-hl">声致发光 App 文档站</h1>
                <h2 class="ui-font-bl">你好，{{ $$account.userName }}，你想查点什么？</h2>
            </div>
            <img src="/assets/images/pixel-bot-findway.png" class="-my-8 -ml-32" />
        </section>
        <section class="w-full flex justify-center items-center">
            <div class="w-3/4 py-16 grid grid-cols-4 grid-rows-2 gap-x-16">
                <div class="flex flex-col gap-2">
                    <h1 class="ui-font-hs flex items-center gap-2"><Icon name="octicon:law-24" class="-translate-y-0.5" size="26" />法律信息</h1>
                    <NuxtLink class="nxlink" to="/docs/legal/tos">服务条款</NuxtLink>
                    <NuxtLink class="nxlink" to="/docs/legal/privacy">隐私政策</NuxtLink>
                </div>
                <div class="flex flex-col gap-2">
                    <h1 class="ui-font-hs flex items-center gap-2"><Icon name="mynaui:globe" class="-translate-y-0.25" size="26" />社区指引</h1>
                    <NuxtLink class="nxlink" to="/docs/community/creation-policy">社区创建政策</NuxtLink>
                    <NuxtLink class="nxlink" to="/docs/community/guidelines">社区指导方针</NuxtLink>
                </div>
            </div>
        </section>
    </main>
</template>

<style lang="scss" scoped>
    .nxlink {
        color: var(--color-blue-600);
    }
</style>
