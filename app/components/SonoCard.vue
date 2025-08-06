<script lang="ts" setup>
    defineProps<{ title: string }>();
</script>

<template>
    <div class="card bg-base-100 card-md shadow-sm relative">
        <div class="card-body -m-1 lg:-m-2">
            <h2 class="card-title">
                <span class="text-primary">/</span>
                {{ $props.title }}
                <slot name="extra" />
            </h2>
            <div class="px-4 mt-1 z-10">
                <slot />
            </div>
            <slot name="deco" />
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
