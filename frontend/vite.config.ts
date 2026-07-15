import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Kitrayecto App',
                short_name: 'Kitratecto',
                description: 'App de logística',
                icons: [{
                    src: 'logo-kitrayecto.png',
                    sizes: '192x192',
                    type: 'image/png'
                }]
            }
        })
    ],
})