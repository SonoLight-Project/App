<script lang="ts" setup>
    const route = useRoute();
    const { data } = await useAsyncData(route.path, () => {
        return queryCollection("docs").path(route.path).first();
    });
</script>

<template>
    <main class="w-full h-full flex justify-center items-center">
        <article v-if="data" class="prose px-12 pt-24 pb-8 lg:max-w-4/5">
            <ContentRenderer :value="data" />
        </article>
        <div v-else class="card w-96 h-fit bg-base-100 card-md shadow-sm">
            <div class="card-body flex justify-center items-center">
                <Icon class="text-error" name="line-md:hazard-lights-off-loop" size="64" />
                <h2 class="text-xl mt-2">文章不存在</h2>
                <div class="divider my-0"></div>
                <div class="card-actions w-full">
                    <button class="btn btn-primary w-full" @click="$router.back()">返回上一页</button>
                </div>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
    .prose {
        --tw-prose-body: color-mix(in oklab, var(--color-base-content) 95%, #0000);

        :deep(h2 a),
        :deep(h3 a) {
            text-decoration: none;
        }
    }
</style>
