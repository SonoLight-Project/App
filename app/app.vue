<script lang="ts" setup>
</script>

<template>
    <div class="w-screen p-0">
        <SonoNav/>
        <div id="layout-default" class="w-full h-full pt-16">
            <div class="w-full h-full">
                <!-- Content HERE -->
                <NuxtPage class="min-h-screen"/>
            </div>
        </div>
        <SonoFooter/>
    </div>
    <SonoToast/>
</template>

<style lang="scss">
    .layout-enter-active,
    .layout-leave-active,
    .page-enter-active,
    .page-leave-active {
        transition: all 0.125s ease-in-out;
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
        url("/static/Images/BgMachine.webp");
        background-repeat: no-repeat;
        background-size: cover;
        background-position-y: 50%;
    }
</style>
