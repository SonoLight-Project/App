<script lang="ts" setup>
</script>

<template>
    <div class="w-screen p-0">
        <SonoNav/>
        <section class="w-full h-full bg-primary/75 backdrop-blur-xs">
            <!-- Content HERE -->
            <NuxtPage class="min-h-screen"/>
        </section>
        <SonoFooter/>
    </div>
    <SonoToast/>
    <div id="layout-default" class="w-screen h-screen fixed top-0 left-0 -z-999"></div>
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
        background-image: url("/static/Images/BgMachine.webp");
        background-repeat: no-repeat;
        background-size: contain;
    }
</style>
