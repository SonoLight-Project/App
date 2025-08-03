<script lang="ts" setup>
    import { Analytics } from "@vercel/analytics/nuxt";
    import { SpeedInsights } from "@vercel/speed-insights/nuxt";
</script>

<template>
    <div class="w-screen p-0">
        <SonoNavsGlobalNav />
        <section class="w-full h-full bg-white/80 dark:bg-black/80">
            <NuxtPage class="min-h-screen pt-16" />
        </section>
        <!-- <SonoFooter /> -->
    </div>
    <SonoToast />
    <div class="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center gap-2 backdrop-blur-2xl lg:hidden z-999">
        <h1 class="ui-font-hl scale-120">提示</h1>
        <p class="ui-font-ml scale-120">尚未支持移动设备访问</p>
        <p class="ui-font-ml scale-120">请在 PC 端访问</p>
    </div>
    <!-- Vercel Analysis Components -->
    <Analytics />
    <SpeedInsights />
</template>
