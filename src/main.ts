import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'
import './api/interceptors'
import './assets/styles/main.css'
import 'leaflet/dist/leaflet.css'
const app = createApp(App)
registerPlugins(app)
app.mount('#app')
