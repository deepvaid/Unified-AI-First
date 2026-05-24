import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'
import '../packages/marobase-ui/src/tokens/index.css'
import './design-tokens/generated/variables.css'
import './styles/dv-tokens.css'
import './styles/mp-theme-aliases.css'
import './styles/source-cloud-colors.css'
import './styles/marobase-tokens.css'
import './styles/global.scss'
import './styles/settings-form.scss'
import './styles/accent-presets.css'
import './styles/sidebar-dark.css'
import './styles/retail-widgets.scss'
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
}

registerPlugins(app)

initAppTheme()
app.mount('#app')
