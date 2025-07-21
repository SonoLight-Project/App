<template>
    <div id="layout-default" class="w-full h-full">
        <div class="w-full h-full">
            <!-- Content HERE -->
            <SonoNav />
            <slot />
            <SonoFooter />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    div#layout-default {
        background-image: linear-gradient(
                to right,
                color-mix(in oklab, var(--color-primary), transparent 30%),
                color-mix(in oklab, var(--color-primary), transparent 30%)
            ),
            url("/static/Images/BgItems.webp"), linear-gradient(to right, var(--color-primary), var(--color-primary));
        background-size: cover;
        background-position-y: -15%;
    }
</style>
