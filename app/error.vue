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
        <NuxtLayout>
            <main class="w-full h-21/24 pb-12 flex flex-col justify-center items-center">
                <h1 class="text-secondary text-6xl">{{ errorTitle[errorCode] }}</h1>
                <br/>
                <p class="text-secondary text-2xl">{{ errorDescription[errorCode] }}</p>
                <br/>
                <button class="btn btn-lg btn-secondary" @click="$router.push(`/`)">返回主页</button>
            </main>
        </NuxtLayout>
    </div>
</template>
