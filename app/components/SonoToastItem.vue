<script lang="ts" setup>
    import { onMounted, ref } from "vue";

    defineProps<{
        type: "info" | "success" | "warning" | "error";
        content: any;
    }>();

    const alert = ref<HTMLDivElement>();
    onMounted(() => {
        setTimeout(() => {
            alert.value?.classList.add("opacity-0");
            setTimeout(() => alert.value?.parentElement?.removeChild(alert.value), 250);
        }, 3 * 1000);
    });
</script>

<template>
    <div ref="alert" class="transition-opacity duration-250 ease-in-out">
        <div v-if="$props.type === `success`" ref="alert" class="alert alert-success">
            <svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
            <span class="font-normal">
                {{ $props.content }}
            </span>
        </div>
        <div v-if="$props.type === `info`" ref="alert" class="alert alert-info">
            <svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
            <span class="font-normal">
                {{ $props.content }}
            </span>
        </div>
        <div v-if="$props.type === `warning`" ref="alert" class="alert alert-warning">
            <svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2" />
            </svg>
            <span class="font-normal">
                {{ $props.content }}
            </span>
        </div>
        <div v-if="$props.type === `error`" ref="alert" class="alert alert-error">
            <svg v-if="$props.type === `error`" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2" />
            </svg>
            <span class="font-normal">
                {{ $props.content }}
            </span>
        </div>
    </div>
</template>
