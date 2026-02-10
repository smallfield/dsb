import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

import router from './router'

createApp(App).use(vuetify).use(router).mount('#app')
