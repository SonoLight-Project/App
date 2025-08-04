<script setup lang="ts">
    defineProps<{ title: string }>();

    const itemIndexMin = 1;
    const itemIndexMax = 5;
    const isAnimating = ref(false);

    const currectIndex = ref(1);
    const carouselItemRefs = ref<(HTMLElement | null)[]>([]);
    const carouselStepRefs = ref<(HTMLElement | null)[]>([]);

    const setCIRef = (el: any, index: number) => {
        carouselItemRefs.value[index] = el;
    };
    const setCSRef = (el: any, index: number) => {
        carouselStepRefs.value[index] = el;
    };

    const scrollCI = (index: number) => {
        if (isAnimating.value) return;
        isAnimating.value = true;
        if (index < itemIndexMin) {
            currectIndex.value = itemIndexMax;
            carouselItemRefs.value[itemIndexMin - 1]?.scrollIntoView({
                behavior: "smooth",
            });
            setTimeout(() => {
                carouselItemRefs.value[itemIndexMax]?.scrollIntoView({
                    behavior: "instant",
                });
            }, 1000);
        } else if (index > itemIndexMax) {
            currectIndex.value = itemIndexMin;
            carouselItemRefs.value[itemIndexMax + 1]?.scrollIntoView({
                behavior: "smooth",
            });
            setTimeout(() => {
                carouselItemRefs.value[itemIndexMin]?.scrollIntoView({
                    behavior: "instant",
                });
            }, 1000);
        } else {
            currectIndex.value = index;
            carouselItemRefs.value[index]?.scrollIntoView({
                behavior: "smooth",
            });
        }
        setTimeout(() => {
            isAnimating.value = false;
        }, 1100);
    };
</script>

<template>
    <h1 class="ui-font-hl px-64 pt-8">{{ $props.title }}</h1>
    <section class="w-full h-96 relative flex justify-center items-center mt-8">
        <Icon name="ic:round-keyboard-arrow-left" class="cursor-pointer" size="56" @click="scrollCI(currectIndex - 1)" />
        <section class="w-[70%] h-full carousel carousel-center gap-8">
            <div class="carousel-item skeleton w-full h-full rounded-box" :ref="(el) => setCIRef(el, 0)"></div>
            <div class="carousel-item skeleton w-full h-full rounded-box" v-for="index in 5" :key="index" :ref="(el) => setCIRef(el, index)"></div>
            <div class="carousel-item skeleton w-full h-full rounded-box" :ref="(el) => setCIRef(el, 6)"></div>
        </section>
        <Icon name="ic:round-keyboard-arrow-right" class="cursor-pointer" size="56" @click="scrollCI(currectIndex + 1)" />
    </section>
    <section class="w-full relative flex justify-center items-center gap-4">
        <span
            class="carousel-step-item bg-base-300 dark:bg-base-100"
            v-for="index in 5"
            :key="index"
            :class="{ selected: currectIndex === index }"
            :ref="(el) => setCSRef(el, index)"
            @click="scrollCI(index)"></span>
    </section>
</template>

<style lang="scss" scoped>
    .carousel-step-item {
        width: 32px;
        height: 8px;
        border-radius: calc(infinity * 1px);
        cursor: pointer;
        transition: background-color 0.25s ease-in-out;

        &.selected {
            background-color: color-mix(in oklch, var(--color-base-content) 30%, var(--color-base-100)) !important;
        }
    }
</style>
