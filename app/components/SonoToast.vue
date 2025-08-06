<script lang="ts" setup>
    import { ref } from "vue";
    import { EventBus } from "~/modules/Eventbus";

    interface TAlertInst {
        alertType: "info" | "success" | "warning" | "error";
        content: any;
    }

    const alert_list = ref<TAlertInst[]>([]);
    EventBus.on("toast:create", (payload: TAlertInst) => {
        const list = alert_list.value;
        list.push(payload);
    }); 
</script>

<template>
    <div class="toast toast-end">
        <SonoToastItem v-for="item of alert_list" :key="item.content" :content="item.content" :type="item.alertType" />
    </div>
</template>

<style lang="scss" scoped></style>
