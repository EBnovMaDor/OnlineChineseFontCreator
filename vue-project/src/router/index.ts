import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Test from '../views/Test.vue'
import Login from '../views/Login.vue'
import SvgEditor from '../views/SvgEditorView.vue'
import SvgPreview from '../views/SVGPreview.vue'
import FontPreview from '../views/FontPreview.vue'

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
            name: 'SvgEditor',
            component: SvgEditor
        },
        {
            path: '/font',
            name: 'FontPreview',
            component: FontPreview
        },{
            path: '/svgPreview',
            name: 'SvgPreview',
            component: SvgPreview
        }
    ]
})

export default router
