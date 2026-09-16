import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'
import './styles/app-styles'
import { initAppTheme } from './composables/useAppTheme'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', err, info)
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('ResizeObserver loop')) return
    console.error('[Window Error]', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
  })
  // After a deploy, a tab that still holds the previous index.html asks for route
  // chunks whose hashed files no longer exist, and the routed view renders blank.
  // Vite raises this event on that failure; one reload picks up the new manifest.
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    window.location.reload()
  })
}

registerPlugins(app)

initAppTheme()
app.mount('#app')
