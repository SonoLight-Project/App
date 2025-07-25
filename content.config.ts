import { defineCollection, defineContentConfig } from "@nuxt/content"

export default defineContentConfig({
    collections: {
        docs: defineCollection({
            type: "page",
            source: {
                include: "docs/**/*.md",
            }
        }),
        blog: defineCollection({
            type: "page",
            source: {
                include: "blog/**/*.md",
            }
        })
    }
})
