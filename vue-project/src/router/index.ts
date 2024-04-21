import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Test from '../views/Test.vue'
import Login from '../views/Login.vue'
//import Login2 from '../views/Login2.vue'
import SvgEditor from '../views/SvgEditorView.vue'
import SvgEditorView from '../views/SvgEditorView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },
        {
            path: '/Login',
            name: 'Login',
            component: Login
        },
        {
            path: '/Test',
            name: 'Test',
            component: Test
        },
        {
            path: '/svg',
            name: 'svgEditor',
            component: SvgEditor
        }
    ]
})

export default router
