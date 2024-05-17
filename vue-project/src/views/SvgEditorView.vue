<template>
    <div style="text-align: center">
        <div>fps: {{ fps }}</div>
        <div>System Current Tool: {{ currentTool }}</div>
        <div id="canvas" style="width: 60vw; height: 60vh;margin-top:20px;"></div>
        <div id="preview" style="width: 800px; height: 400px;margin-top:20px;"></div>
        <el-input type="textarea" :rows="5" placeholder="请输入" v-model="word" style="margin-bottom:20px">
        </el-input>
        <el-button type="primary" @click="move"> move </el-button>
        <el-button type="primary" @click="editor"> editor </el-button>
        <el-button type="primary" @click="addStraightLine"> addStraightLine </el-button>
        <el-button type="primary" @click="addCurve"> addCurve </el-button>
        <el-button type="primary" @click="deleteLine"> deleteLine </el-button>
        <el-button type="primary" @click="deletePoint"> deletePoint</el-button>
        <el-button type="primary" @click="addRectangle"> addRectangle </el-button>
        <el-button type="primary" @click="addCircle"> addCircle </el-button>
        <el-button type="primary" @click="addTriangle"> addTriangle </el-button>
        <el-button type="primary" @click="mark"> mark </el-button>
        <el-button type="primary" @click="markText"> markText </el-button>
        <el-button type="primary" @click="ruler"> ruler </el-button>
        <el-button type="primary" @click="deleteMark"> deletemark </el-button>
        <el-button type="primary" @click="shapeMark"> shapeMark </el-button>
        <el-button type="primary" @click="changeFill"> changeFill </el-button>
        <el-button type="primary" @click="importSVG"> 导入SVG </el-button>
        <el-button type="primary" @click="setFont"> 设置字 </el-button>
        <div v-if="pointPos">点的坐标 x: {{ pointx1 }}, y:{{ pointy1 }}</div>
        <div v-if="linePos">直线的两点坐标 (x1: {{ pointx1 }}, y1:{{ pointy1 }}); (x2: {{ pointx2 }}, y2:{{ pointy2 }}); 直线的长度
            : {{ length1 }} ; 线的角度: {{ angle1 }}度</div>
        <div v-if="curvePos">曲线的两点坐标 (x1: {{ pointx1 }}, y1:{{ pointy1 }}); (x2: {{ pointx2 }}, y2:{{ pointy2 }});
            控制线长度：{{ length1 }} ; {{ length2 }} ; 线的角度: {{ angle1 }} 度; {{ angle2 }}度</div>
    </div>
    <div>
        <div v-if="showInputBox"><input type="text" v-model="inputValue" placeholder="请输入值"><el-button
                @click="submitInput">提交</el-button></div>
        <div v-if="showInputBox2"><input type="text" v-model="inputValue" placeholder="请输入值"><el-button
                @click="submitInput2">提交</el-button></div>
        <div v-for="item in list" :key="item.gui_id">
            <div :class="(item.gui_id == markedId && showInputBox == true) ? 'back-red' : 'back-blue'"
                @mouseenter="markShow(item.gui_id)" @mouseleave="markHide(item.gui_id)">元素编号：{{ item.gui_id }} ; 标注：{{
                    item.gui_mark }}<el-button @click="editComment(item.gui_id)">编辑</el-button>
                ><el-button @click="deleteComment(item.gui_id)">删除</el-button></div>
        </div>
    </div>
    <div>

    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { ElScrollbar } from 'element-plus'
import SvgEditor from '../lib/svg-editor/SvgEditor'
import { useRouter } from 'vue-router'
import router from '@/router'
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()
let svgEditor: SvgEditor | undefined
const ws = new WebSocket('ws://localhost:8000');

export default defineComponent({

    data() {
        return {
            showInputBox: false,
            showInputBox2: false,
            inputValue: "",
            fps: 60,
            viewPortX: 0,
            viewPortY: 0,
            viewPortWidth: 0,
            viewPortHeight: 0,
            baseBufferMinX: 0,
            baseBufferMaxX: 0,
            baseBufferMinY: 0,
            baseBufferMaxY: 0,
            baseBufferWidth: 0,
            baseBufferHeight: 0,
            guiWidth: 0,
            guiHeight: 0,
            currentTool: "move",
            svgEditor: undefined as SvgEditor | undefined,
            svgpath: '今',
            username: '',
            ifSend: 0,
            markedId: -1,
            comment: "1",
            list: [] as any,
            pointPos: false,
            linePos: false,
            curvePos: false,
            pointx1: 0,
            pointx2: 0,
            pointy1: 0,
            pointy2: 0,
            length1: 0,
            length2: 0,
            angle1: 0,
            angle2: 0,
            word: "意",
            font: "font_1",
            previewString: "今国意我永然警转酬随风鹰"
        }
    },
    mounted() {
        svgEditor = new SvgEditor('canvas')
        this.getInfo()
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
        importSVG() {
            svgEditor?.importSVG()
        },
        setFont() {
            svgEditor?.importSVG()
        },
        move() {
            svgEditor?.setTool('move')
        },
        editor() {
            svgEditor?.setTool('editor')
        },
        addStraightLine() {
            svgEditor?.setTool('addStraightLine')
        },
        addCurve() {
            svgEditor?.setTool('addCurve')
        },
        deleteLine() {
            svgEditor?.setTool('deleteLine')
        },
        deletePoint() {
            svgEditor?.setTool('deletePoint')
        },
        deleteMark() {
            svgEditor?.setTool('deleteMark')
        },
        mergePoint() {
            svgEditor?.setTool('mergePoint')
        },
        addRectangle() {
            svgEditor?.setTool('addRectangle')
        },
        addCircle() {
            svgEditor?.setTool('addCircle')
        },
        addTriangle() {
            svgEditor?.setTool('addTriangle')
        },
        ruler() {
            svgEditor?.setTool('ruler')
        },
        send() {
            const svgPath = this.svgpath;
            if (!svgPath.trim().length) {
                return;
            }
            ws.send(JSON.stringify({
                id: new Date().getTime(),
                user: this.username,
                msg: this.svgpath
            }))
        },
        mark() {
            svgEditor?.setTool('mark')
        },
        shapeMark() {
            svgEditor?.setTool('shapeMark')
        },
        changeFill() {
            svgEditor?.setTool('changeFill')
        },
        markText() {
            svgEditor?.setTool('markText')
        },
        editComment(id: number) {
            svgEditor!.markedId = id
            svgEditor!.ifMarked = true
        },
        deleteComment(id: number) {
            svgEditor?.markComment(this.markedId, "")
            svgEditor!.ifSend = 1
        },
        submitInput() {
            if (this.inputValue.length == 0) {
                svgEditor!.unMark(this.markedId)
                svgEditor!.markComment(this.markedId, this.inputValue)
                return
            }
            svgEditor!.markComment(this.markedId, this.inputValue)
            svgEditor!.ifSend = 1
            this.inputValue = ""
            svgEditor!.ifMarked = false
        },
        submitInput2() {
            if (this.inputValue.length == 0) {
                return
            }
            svgEditor?.markOnCanvas(svgEditor.markPoint.x, svgEditor.markPoint.y, this.inputValue)
            svgEditor!.ifSend = 1
            this.inputValue = ""
            svgEditor!.ifMarkedCanvas = false
        },
        markShow(id: number) {
            svgEditor!.Mark(id)
        },
        markHide(id: number) {
            svgEditor!.unMark(id)
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
            if (msg.font == this.font && msg.word == this.word) {
                svgEditor!.handleSVG(msg)
            }
            this.list = []
            let comment = svgEditor!.transCmt()
            for (let i = 0; i < comment.length; i++) {
                var mark = { gui_id: comment[i], gui_mark: comment[i + 1] }
                i++
                this.list.push(mark)
            }
        },
        getInfo() {
            setTimeout(() => {
                let fps = svgEditor?.fps
                this.fps = fps!
                let { x, y, width, height } = svgEditor!.viewPort
                let minX = svgEditor!.baseBuffer.minX
                let minY = svgEditor!.baseBuffer.minY
                let maxX = svgEditor!.baseBuffer.maxX
                let maxY = svgEditor!.baseBuffer.maxY
                this.guiWidth = svgEditor!.gui.canvasWidth
                this.guiHeight = svgEditor!.gui.canvasHeight
                this.viewPortX = x
                this.viewPortY = y
                this.viewPortWidth = width
                this.viewPortHeight = height
                this.baseBufferWidth = svgEditor!.baseBuffer.bufferWidth
                this.baseBufferHeight = svgEditor!.baseBuffer.bufferHeight
                this.baseBufferMinX = minX
                this.baseBufferMinY = minY
                this.baseBufferMaxX = maxX
                this.baseBufferMaxY = maxY
                this.currentTool = svgEditor!.currentTool
                this.showInputBox = svgEditor?.ifMarked!
                this.showInputBox2 = svgEditor?.ifMarkedCanvas!
                this.markedId = svgEditor?.markedId!
                this.pointPos = svgEditor!.pointPos
                if (this.pointPos) {
                    let posSegment = svgEditor!.posSegment
                    this.pointx1 = posSegment[0]
                    this.pointy1 = posSegment[1]
                }
                this.linePos = svgEditor!.linePos
                if (this.linePos) {
                    let posSegment = svgEditor!.posSegment
                    this.pointx1 = posSegment[0]
                    this.pointy1 = posSegment[1]
                    this.pointx2 = posSegment[2]
                    this.pointy2 = posSegment[3]
                    this.length1 = posSegment[4]
                    this.angle1 = posSegment[5]
                }
                this.curvePos = svgEditor!.curvePos
                if (this.curvePos) {
                    let posSegment = svgEditor!.posSegment
                    this.pointx1 = posSegment[0]
                    this.pointy1 = posSegment[1]
                    this.pointx2 = posSegment[2]
                    this.pointy2 = posSegment[3]
                    this.length1 = posSegment[4]
                    this.length2 = posSegment[5]
                    this.angle1 = posSegment[6]
                    this.angle2 = posSegment[7]
                }
                this.ifSend = svgEditor?.ifSend!
                if (this.ifSend == 1) {
                    svgEditor!.ifSend = 0
                    let segment = svgEditor!.msgSend
                    for (let i = 0; i < segment.length; i++) {
                        if (segment[i][0] == 'i') {
                            ws.send(JSON.stringify({
                                op: segment[i][0],
                                font: this.font,
                                word: this.word
                            }))
                        }
                        else if (segment[i][0] == 'edit') {
                            ws.send(JSON.stringify({
                                op: segment[i][0],
                                font: this.font,
                                word: this.word,
                                svg_id: segment[i][1],
                                svg: segment[i][2],
                                fill: segment[i][3]
                            }))
                        }
                        else if (segment[i][0] == 'add') {
                            ws.send(JSON.stringify({
                                op: segment[i][0],
                                font: this.font,
                                word: this.word,
                                svg_id: segment[i][1],
                                svg: segment[i][2],
                                fill: segment[i][3]
                            }))
                        }
                        else if (segment[i][0] == 'delete') {
                            ws.send(JSON.stringify({
                                op: segment[i][0],
                                font: this.font,
                                word: this.word,
                                svg_id: segment[i][1],
                            }))
                        }
                        else if (segment[i][0] == 'changeFill') {
                            ws.send(JSON.stringify({
                                op: segment[i][0],
                                font: this.font,
                                word: this.word,
                                svg_id: segment[i][1],
                                fill: segment[i][2]
                            }))
                        }
                    }
                }
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

.back-red {
    /* 红色背景 */
    /* width: 1000px;
	height: 100px; */
    background-color: orange;
}

.back-blue {
    /* 蓝色背景 */
    /* width: 100px; */
    /* height: 100px; */
    background-color: white;
}

#canvas {
    border: 1px #0089a7dd solid;
    border-radius: 8px;
    box-shadow: 2px 2px 16px #0089a766;
    touch-action: none;
    user-select: none;
}
</style>
