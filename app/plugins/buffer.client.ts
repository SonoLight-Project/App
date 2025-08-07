// plugins/buffer.client.ts
import { defineNuxtPlugin } from '#app'
import { Buffer } from 'buffer'

export default defineNuxtPlugin(() => {
    // 将 Buffer polyfill 附加到全局 window 对象上
    // 使得依赖全局Buffer的库可以正常运行
    if (typeof window !== 'undefined') {
        (window as any).Buffer = Buffer
    }
})