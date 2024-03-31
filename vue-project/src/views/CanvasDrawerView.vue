<template>
    <div style="text-align:center">
        <div> 推荐使用Chrome浏览器</div>
        <div style="margin-bottom:20px"> 请注意：如您使用Apple Pencil作为书写工具，请前往设置->Apple Pencil处，将随手写功能关闭，否则会导致BUG</div>
        <canvas id="draw-canvas" width="512" height="512"></canvas>
        <div style="text-align:center;justify-content: center;display: flex;">
            <el-slider v-model="maxStrokeWidth" :min="15" :max="50" :step="2" style="width:30vw;"
                @change="changeMaxStrokeWidth">
            </el-slider>
        </div>
        <el-button @click="clearDrawCanvas" type="primary">
            <i class="fa-solid fa-eraser"></i> 清空
        </el-button>
        <el-button @click="undoDrawCanvas" type="primary">
            <i class="fa-solid fa-rotate-left"></i> 撤销
        </el-button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CanvasDrawer from '../lib/canvas-drawer/CanvasDrawer'

export default defineComponent({
    data() {
        return {
            maxStrokeWidth: 25,
            canvasDrawer: undefined as CanvasDrawer | undefined,
        }
    },
    mounted() {
        this.canvasDrawer = new CanvasDrawer('draw-canvas')
    },
    methods: {
        changeMaxStrokeWidth(value: any): void {
            this.canvasDrawer!.setMaxStrokeWidth(value)
        },
        clearDrawCanvas() {
            this.canvasDrawer!.clearCanvas()
        },
        undoDrawCanvas() {
            this.canvasDrawer!.undoOperation()
        },
        getCanvasBlob() {
            return this.canvasDrawer!.getBlob()
        }
    }
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

#draw-canvas {
    width: 90vw;
    max-width: 500px;
    height: 90vw;
    max-height: 500px;
    border: 1px #0089A7DD solid;
    border-radius: 8px;
    box-shadow: 2px 2px 16px #0089A766;
    touch-action: none;
    user-select: none;
}
</style>
