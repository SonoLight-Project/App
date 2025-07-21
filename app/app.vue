<template>
    <div class="w-screen h-screen p-0">
        <NuxtLayout>
            <NuxtPage/>
        </NuxtLayout>
    </div>
    <SonoToast />
</template>

<style lang="scss">
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
</style>
