<script lang="ts" setup>
    import type { NuxtError } from "#app";
    
    const _props = defineProps({
        error: Object as () => NuxtError,
    });
    
    const errorCode = computed<number>(() => _props.error?.statusCode ?? 1000);
    
    interface IErrorTextObj {
        [key: number]: string;
    }
    
    const errorTitle: IErrorTextObj = {
        // HTTP Status
        404: "这里... 什么都没有呢...",
        // Custom
        1000: "未知错误",
    };
    
    const errorDescription: IErrorTextObj = {
        // HTTP Status
        404: "没有找到您所请求的内容",
        // Custom
        1000: "请联系站点管理员",
    };
</script>

<template>
    <div class="w-screen h-screen p-0">
        <div id="layout-default" class="w-full h-full">
            <div class="w-full h-full">
                <!-- Content HERE -->
                <SonoNav/>
                <main class="w-full h-full pb-12 flex flex-col justify-center items-center">
                    <h1 class="text-secondary text-4xl md:text-5xl lg:text-6xl">{{ errorTitle[errorCode] }}</h1>
                    <br/>
                    <p class="text-secondary text-lg md:text-xl lg:text-2xl">{{ errorDescription[errorCode] }}</p>
                    <br/>
                    <button class="btn btn-md md:btn-lg btn-secondary" @click="$router.push(`/`)">返回主页</button>
                </main>
                <SonoFooter/>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .layout-enter-active,
    .layout-leave-active,
    .page-enter-active,
    .page-leave-active {
        transition: all .125s ease-in-out;
    }
    
    .layout-enter-from div#__nuxt,
    .layout-leave-to div#__nuxt,
    .page-enter-from,
    .page-leave-to {
        opacity: 0;
        scale: 105%;
    }
    
    div#layout-default {
        background-image: linear-gradient(
                        to right,
                        color-mix(in oklab, var(--color-primary), transparent 25%),
                        color-mix(in oklab, var(--color-primary), transparent 25%)
        ),
        url("/static/Images/BgItems.webp"), linear-gradient(to right, var(--color-primary), var(--color-primary));
        background-size: cover;
        background-position: center; background-position-y: -15%; @media (max-width: 768px) { background-position-y: 0; }
    }
</style>