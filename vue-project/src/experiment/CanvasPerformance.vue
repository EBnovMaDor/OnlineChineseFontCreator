<template>
    <div style="text-align: center">
        <!-- <svg id="svg" width="512" height="512"></svg> -->
        <div>fps ：{{ fps }}</div>
        <div id="canvas" style="width: 60vw; height: 60vh"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { ElScrollbar } from 'element-plus'
import CanvasTest from './CanvasTest'
export default defineComponent({
    data() {
        return {
            canvasTest: undefined as CanvasTest | undefined,
            fps: 60,
            svgpath: 'M 0 0 M 3 1 M 3 0 C 3.6667 0 4.3333 0 6 0 L 6 1 M 4 2 L 8 1 Q 10 3 7 3 Q 5 5 3 4 C 2 4 1 4 0 2 Z M 9 5 L 3 7 L 5 9 L 9 5'
        }
    },
    mounted() {
        this.canvasTest = new CanvasTest("canvas")
        this.getInfo()
    },
    methods: {
        getInfo() {
            setTimeout(() => {
                let fps = this.canvasTest?.fps
                this.fps = fps!
                this.getInfo()
            }, 50)
        },
    },
})
</script>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}

#canvas {
    border: 1px #0089a7dd solid;
    border-radius: 8px;
    box-shadow: 2px 2px 16px #0089a766;
    touch-action: none;
    user-select: none;
}
</style>
