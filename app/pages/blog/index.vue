<script setup lang="ts"></script>

<template>
    <main class="w-full h-full flex justify-center items-center">
        <div class="card w-96 h-fit bg-base-100 card-md shadow-sm">
            <div class="card-body flex justify-center items-center">
                <Icon name="line-md:uploading-loop" class="text-info" size="64" />
                <h2 class="text-xl mt-2">此页面还在制作中！</h2>
                <div class="divider my-0"></div>
                <div class="card-actions w-full">
                    <button class="btn btn-primary w-full" @click="$router.back()">返回上一页</button>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped lang="scss"></style>
