import { createRouter, createWebHistory } from 'vue-router'
import TrainBoard from '../components/TrainBoard.vue'

const routes = [
  {
    path: '/',
    redirect: '/KH/ØRE' // Default keys for København H and Ørestad
  },
  {
    path: '/:stationA/:stationB',
    name: 'TrainBoard',
    component: TrainBoard,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
