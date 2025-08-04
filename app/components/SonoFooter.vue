<script lang="ts" setup>
    const yearNow = new Date().getFullYear();
</script>

<template>
    <footer class="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
        <aside>
            <img alt="SonoLight Border Iocn" class="size-16 -rotate-8" src="/assets/images/sonolight-border-icon.png" />
            <p class="font-bold text-base">
                声致发光 SonoLight
                <br />
                版权所有 &copy; 2024~{{ yearNow }}，
                <NuxtLink class="link" href="https://github.com/SonoLight-Project">SonoLight 项目组</NuxtLink>
                保留所有权利。
                <br />
                本页面背景图像由社区提供，版权由对应作者所有
            </p>
        </aside>
        <nav>
            <h6 class="footer-title">法律信息</h6>
            <NuxtLink class="link link-hover" href="/docs/legal/tos">「 服务协议 (ToS) 」</NuxtLink>
            <NuxtLink class="link link-hover" href="/docs/legal/privacy-policy">「 隐私政策 」</NuxtLink>
        </nav>
        <nav>
            <h6 class="footer-title">社区指引</h6>
            <NuxtLink class="link link-hover" href="/docs/community/creation-policy">「 社区创建政策 」</NuxtLink>
            <NuxtLink class="link link-hover" href="/docs/community/guidence">「 社区指导方针 」</NuxtLink>
        </nav>
    </footer>
</template>
