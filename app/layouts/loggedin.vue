<template>
    <div id="layout-default" class="w-full h-full">
        <div class="w-full h-full">
            <!-- Content HERE -->
            <SonoNav logged_in />
            <slot />
            <SonoFooter> · 本页面背景图像由社区提供，版权由对应作者所有</SonoFooter>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    div#layout-default {
        background-image: linear-gradient(
                        to right,
                        color-mix(in oklab, var(--color-primary), transparent 25%),
                        color-mix(in oklab, var(--color-primary), transparent 25%)
        ),
        url("/static/Images/BgMachine.webp");
        background-repeat: no-repeat;
        background-size: cover;
        background-position-y: 50%;
    }
</style>
<script setup lang="ts">
</script>