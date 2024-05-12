<template>
    <div><input type="text" v-model="wordSpacing" placeholder="字间距值"><el-button type="primary"
            @click="submitInput">提交</el-button></div>
    <div><input type="text" v-model="lineSpacing" placeholder="行间距值"><el-button type="primary"
            @click="submitInput2">提交</el-button></div>
    <div><input type="text" v-model="fontSize" placeholder="字号"><el-button type="primary"
            @click="submitInput3">提交</el-button></div>
    <div style="text-align: center">
        <div id="preview" style="width: 800px; height: 400px;margin-top:20px;"></div>
        <el-button type="primary" @click="sendMessage"> 导入 </el-button>
        <el-button type="primary" @click="typesetting"> 排版 </el-button>
        <el-input type="textarea" :rows="5" placeholder="请输入" v-model="word" style="margin-bottom:20px">
        </el-input>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { ElScrollbar } from 'element-plus'
import SvgPreviewer from '../lib/svg-editor/SvgPreviewer'
import { useRouter } from 'vue-router'
import router from '@/router'

const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()
let svgPreviewer: SvgPreviewer | undefined

const ws = new WebSocket('ws://localhost:8000');

export default defineComponent({

    data() {
        return {
            wordSpacing: '',
            lineSpacing: '',
            fontSize: '',
            svgPreviewer: undefined as SvgPreviewer | undefined,
            username: '',
            word: "",
            font: "font_1"
        }
    },
    mounted() {
        svgPreviewer = new SvgPreviewer('preview')
        this.username = localStorage.getItem('username') || '';
        if (!localStorage.getItem('username')) {
            router.push('/login')
            return;
        }
        ws.addEventListener('open', this.handleWsOpen.bind(this), false)
        ws.addEventListener('close', this.handleWsClose.bind(this), false)
        ws.addEventListener('error', this.handleWsError.bind(this), false)
        ws.addEventListener('message', this.handleWsMessage.bind(this), false)
    },
    methods: {
        typesetting() {
            svgPreviewer!.update()
            svgPreviewer!.typeSetting(this.wordSpacing,this.lineSpacing,this.fontSize)
            svgPreviewer!.changeToPreview()
        },
        submitInput() {

        },
        submitInput2() {

        },
        submitInput3() {

        },
        handleWsOpen(e: any) {
            console.log('FE:WebSocket:open', e)
        },
        handleWsClose(e: any) {
            console.log('FE:WebSocket:close', e)
        },
        handleWsError(e: any) {
            console.log('FE:WebSocket:error', e)
        },
        handleWsMessage(e: any) {
            const msg = JSON.parse(e.data);
            // console.log('FE:WebSocket:message',msg)
            if (msg.font == this.font) {
                svgPreviewer!.handleSVG(msg)
            }
        },
        sendMessage() {
            // svgPreviewer = new SvgPreviewer('preview')
            
            if (ws.readyState === WebSocket.OPEN) {
                let segment = this.word
                svgPreviewer?.refresh()
                for (let i = 0; i < segment.length; i++) {
                    let curword = this.word[i]
                    console.log("import svg!", curword)
                    ws.send(JSON.stringify({
                        op: 'preview',
                        font: this.font,
                        word: curword
                    }))
                }
            } else if (ws.readyState == WebSocket.CONNECTING) {
                ws.addEventListener('open', () => this.sendMessage())
            }
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

#preview {
    border: 1px #0089a7dd solid;
    border-radius: 8px;
    box-shadow: 2px 2px 16px #0089a766;
    touch-action: none;
    user-select: none;
}
</style>
