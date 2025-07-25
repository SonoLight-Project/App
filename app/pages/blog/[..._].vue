<script lang="ts" setup>
    const route = useRoute();
    const { data } = await useAsyncData(route.path, () => {
        return queryCollection("blog").path(route.path).first();
    });
</script>

<template>
    <main class="w-full h-full flex justify-center">
        <article class="prose px-12 pt-24 pb-8 lg:max-w-4/5">
            <ContentRenderer v-if="data" :value="data" />
        </article>
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
