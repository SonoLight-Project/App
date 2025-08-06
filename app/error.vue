<script lang="ts" setup>
    const error = useError();

    interface ErrorDetail {
        title: string;
        description: string[];
    }
    const errorMessages: Record<number, ErrorDetail> = {
        500: {
            title: "500 内部服务器错误",
            description: ["服务器遇到了一个内部错误，无法完成您的请求", "请稍后重试，如果此问题持续存在，请联系管理员"],
        },
        404: {
            title: "404 未找到页面",
            description: ["页面不存在"],
        },
        401: {
            title: "401 未授权",
            description: ["您没有权限访问此页面"],
        },
    };
    const errorDetail = computed<ErrorDetail>(
        () =>
            errorMessages[error.value!.statusCode] ?? {
                title: "-1 未知错误",
                description: ["请稍后重试，如果此问题持续存在，请联系管理员"],
            }
    );
</script>

<template>
    <div class="w-screen p-0">
        <SonoNavsGlobalNav />
        <section class="w-full h-full min-h-screen backdrop-blur-md bg-black/95 flex flex-col items-center justify-center">
            <h1 class="ui-font-hl fade-up">{{ errorDetail.title }}</h1>
            <br />
            <p class="ui-font-p fade-up" v-for="(item, index) in errorDetail.description" :key="index">
                {{ item }}
            </p>
        </section>
        <!-- <SonoFooter /> -->
    </div>
    <SonoToast />
    <div id="background" class="w-screen h-screen fixed top-0 left-0 -z-999"></div>
</template>

<style lang="scss" scoped>
    .fade-up {
        transform: translateY(20px);
        animation: fadeUp 0.5s ease-in-out forwards;
    }

    @keyframes fadeUp {
        from {
            transform: translateY(20px);
        }
        to {
            transform: translateY(0);
        }
    }
</style>
