import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
            },
            manifest: {
                name: 'Kitrayecto App',
                short_name: 'Kitratecto',
                description: 'App de logística',
                lang: 'es-CO',
                icons: [{
                    src: 'logo-kitrayecto.png',
                    sizes: '192x192',
                    type: 'image/png'
                }]
            }
        })
    ],
})
