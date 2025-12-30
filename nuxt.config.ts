// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';
import pkg from './package.json';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss'
  ],
  
  pinia: {
    storesDirs: ['./app/stores/**'],
  },
  
  primevue: {
    options: {
      ripple: true,
      inputVariant: 'filled',
      theme: {
          preset: Aura,
      }
    },
    components: {
      include: [
        'Button', 
        'Dialog', 
        'Toast', 
        'ConfirmDialog',
        'ProgressBar', 
        'ProgressSpinner',
        'Checkbox', 
        'Textarea', 
        'Card', 
        'Accordion', 
        'AccordionPanel', 
        'AccordionHeader', 
        'AccordionContent',
        'InputText',
        'Message',
        'Panel',
        'Divider',
        'Dropdown',
        'RadioButton'
      ]
    }
  },
  vite: {
    server: {
      //Allow a domain
      allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'assessment.vakamaka.com', 'assessment-dev.vakamaka.com'],
    } 
  },
  runtimeConfig: {
    public: {
      // .env dosyasından okunur: NUXT_PUBLIC_API_BASE_URL
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api-dev.vakamaka.com',
      appName: 'Vakamaka Online Assessment',
      appVersion: pkg.version
    }
  },
  
  app: {
    head: {
      title: 'Online Değerlendirme - Vakamaka',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Vakamaka Online Değerlendirme Sistemi' },
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/global.css'
  ],
  
  ssr: false // SPA mode (session token için)
})
