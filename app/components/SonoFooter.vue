<script lang="ts" setup>
    const yearNow = new Date().getFullYear();
</script>

<template>
    <footer class="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
        <aside>
            <img alt="SonoLight Border Iocn" class="size-16 -rotate-8" src="/static/Images/sonolight-border-icon.png"/>
            <p class="font-bold text-base">
                声致发光 SonoLight
                <br/>
                版权所有 &copy; 2024~{{ yearNow }}，
                <a class="link" href="https://github.com/SonoLight-Project">SonoLight 项目组</a>
                保留所有权利。
                <br />
                本页面背景图像由社区提供，版权由对应作者所有
            </p>
        </aside>
        <nav>
            <h6 class="footer-title">Services</h6>
            <a class="link link-hover">Branding</a>
            <a class="link link-hover">Design</a>
            <a class="link link-hover">Marketing</a>
            <a class="link link-hover">Advertisement</a>
        </nav>
        <nav>
            <h6 class="footer-title">Company</h6>
            <a class="link link-hover">About us</a>
            <a class="link link-hover">Contact</a>
            <a class="link link-hover">Jobs</a>
            <a class="link link-hover">Press kit</a>
        </nav>
        <nav>
            <h6 class="footer-title">Legal</h6>
            <a class="link link-hover">Terms of use</a>
            <a class="link link-hover">Privacy policy</a>
            <a class="link link-hover">Cookie policy</a>
        </nav>
    </footer>
</template>
