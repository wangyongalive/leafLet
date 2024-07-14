import './css/main.less'
import 'leaflet.zoomslider'
import 'leaflet/dist/leaflet.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { mockAllData } from './js/mock'

mockAllData()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
