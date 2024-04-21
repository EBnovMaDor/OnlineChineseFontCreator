<template>
    <div style="text-align: center">
        <div>fps: {{ fps }}</div>
        <div>System Current Tool: {{ currentTool }}</div>
        <div class="mousetest" id="canvas" style="width: 60vw; height: 60vh;margin-top:20px;"
            @mouseenter="changeActive($event)" @mouseleave="removeActive($event)"></div>
        <el-button type="primary" @click="test"> Test </el-button>

        <el-input type="textarea" :rows="5" placeholder="请输入SVG Path" v-model="svgpath" style="margin-bottom:20px">
        </el-input>
        <el-button type="primary" @click="move"> move </el-button>
        <el-button type="primary" @click="editor"> editor </el-button>
        <el-button type="primary" @click="addStraightLine"> addStraightLine </el-button>
        <el-button type="primary" @click="addCurve"> addCurve </el-button>
        <el-button type="primary" @click="deleteLine"> deleteLine </el-button>
        <el-button type="primary" @click="deletePoint"> deletePoint</el-button>
        <!-- <el-button type="primary" @click="send"> send </el-button> -->
        <el-button type="primary" @click="mark"> mark </el-button>
        <el-button type="primary" @click="deleteMark"> deletemark </el-button>
        <el-button type="primary" @click="importSVG"> 导入SVG </el-button>
        <el-button type="primary" @click="exportSVG"> 导出SVG </el-button>
    </div>
    <div>
    <div v-if="showInputBox"><input type="text" v-model="inputValue" placeholder="请输入值"><el-button @click="submitInput">提交</el-button></div>
    <div v-if="showInputBox2"><input type="text" v-model="inputValue" placeholder="请输入值"><el-button @click="submitInput2">提交</el-button></div>
    <!-- <div v-else>empty</div> -->
    <!-- <div v-if="showCommentBox">元素编号：{{ markedId }} ; 标注：{{ comment }}<el-button @click="editComment">编辑</el-button></div> -->
    <div v-for="item in list" :key="item.gui_id"><div :class="(item.gui_id == markedId && showInputBox == true)? 'back-red' : 'back-blue'"  @mouseenter="markShow(item.gui_id)" @mouseleave="markHide(item.gui_id)">元素编号：{{ item.gui_id }} ; 标注：{{ item.gui_mark }}<el-button @click="editComment(item.gui_id)">编辑</el-button>
    ><el-button @click="deleteComment(item.gui_id)">删除</el-button></div></div>
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
            showInputBox:false,
            showInputBox2:false,
            // showCommentBox:false,
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
            svgpath: 'M 0 0 M 3 1 M 3 0 C 3.6667 0 4.3333 0 6 0 L 6 1 M 4 2 L 8 1 Q 10 3 7 3 Q 5 5 3 4 C 2 4 1 4 0 2 Z M 9 5 L 3 7 L 5 9 L 9 5',
            username: '',
            ifSend: 0,
            markedId: -1,
            comment:"1",
            list: [] as any
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
            svgEditor?.importSVG(this.svgpath)
        },
        exportSVG() {
            svgEditor?.exportSVG()
        },
        test() {
            svgEditor?.test()
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
        mark(){
            svgEditor?.setTool('mark')
        },
        editComment(id : number){
            svgEditor!.markedId = id
            svgEditor!.ifMarked = true
        },
        deleteComment(id:number){
            // svgEditor!.unMark(this.markedId)
            svgEditor?.markComment(this.markedId,"")
            svgEditor!.ifSend = 1
            // this.markedId = 
        },
        submitInput(){
            console.log(this.inputValue.length);
            if(this.inputValue.length == 0){
                // console.log("输入不能为空")
                svgEditor!.unMark(this.markedId)
                svgEditor?.markComment(this.markedId,this.inputValue)
                return
            }
            console.log(this.markedId)
            svgEditor?.markComment(this.markedId,this.inputValue)
            // console.log("wozaisubmit",this.ifSend)
            svgEditor!.ifSend = 1
            // 隐藏输入框
            this.inputValue = ""
            svgEditor!.ifMarked = false
            // this.showInputBox=false;
        },
        submitInput2(){
            console.log(this.inputValue.length);
            if(this.inputValue.length == 0){
                console.log("输入不能为空")
                // svgEditor!.unMark(this.markedId)
                // svgEditor?.markComment(this.markedId,this.inputValue)
                return
            }
            svgEditor?.markOnCanvas(svgEditor.markPoint.x,svgEditor.markPoint.y,this.inputValue)
            svgEditor!.ifSend = 1
            // 隐藏输入框
            this.inputValue = ""
            svgEditor!.ifMarkedCanvas = false
            // this.showInputBox=false;
        },
        markShow(id:number){
            svgEditor!.Mark(id)
        },
        markHide(id:number){
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
            const msg = JSON.parse(e.data.toString());
            // console.log(msg)
            // console.log('FE:WebSocket:message',msg.msg)
            this.list= []
            for (let i = 0; i < msg.cmt.length; i++) {
                console.log("111")
            // let element = msg.cmt[i]
            // element!.comment = msg.cmt[i]
            var mark:any = { gui_id: msg.cmt[i], gui_mark: msg.cmt[i+1]} 
            i++
            this.list.push(mark)
            }
            if(svgEditor)
                svgEditor.acceptSVG(msg.svg,msg.cmt)
            // console.log('FE:WebSocket:message',e)
        },
        changeActive(e: MouseEvent) {
            // console.log(e);
        },
        removeActive(e: MouseEvent) {
            // if (e.currentTarget)
                // (e.currentTarget as HTMLElement).className = '';
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
                // this.showCommentBox = svgEditor?.isMarked!
                // if(this.showCommentBox){
                //     this.comment = svgEditor!.showComment(this.markedId)!
                // }
                this.ifSend = svgEditor?.ifSend!
                if (this.ifSend == 1) {
                    // console.log("我是vue里的ifsend", this.ifSend)
                    // console.log("svgEditor",svgEditor)
                    if (svgEditor) {
                        svgEditor.ifSend = 0
                        let comment = svgEditor.transCmt()
                        console.log("我是vue里的comment",comment)
                        let segment = svgEditor.transSVG()
                        // console.log("我是vue里的segment",segment)
                        ws.send(JSON.stringify({
                            id: new Date().getTime(),
                            user: this.username,
                            svg: segment,
                            cmt:comment
                        }))
                        // console.log("我是vue里的send")
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
.back-red{		/* 红色背景 */
	/* width: 1000px;
	height: 100px; */
	background-color: orange;
}
.back-blue{		/* 蓝色背景 */
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
