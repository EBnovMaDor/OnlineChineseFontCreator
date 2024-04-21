<template>
	<div class="app-container">
		<div class="flex-container">
			<!--顶栏-->
			<header class="header">
				<!--左边-->
				<div class="left">设计</div>
				<!--中间-->
				<div class="middle">
					<el-link type="info" :underline="false">新宋体字库项目</el-link>
					<span style="color: #909399; font-size:18px">/</span>
					<span style="margin-left: 8px;">12模板字设计</span>
					<el-dropdown trigger="click">
						<span class="el-dropdown-link">
							<el-icon class="el-icon--right">
								<arrow-down />
							</el-icon>
						</span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item>版本历史</el-dropdown-item>
								<el-dropdown-item divided>转到任务</el-dropdown-item>
								<el-dropdown-item>转到项目</el-dropdown-item>
								<el-dropdown-item divided>修改任务</el-dropdown-item>
								<el-dropdown-item disabled>删除任务</el-dropdown-item>

							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
				<!--用户-->
				<div class="right">
					<el-row :gutter="0" style="margin-right:0; width:200px;">
						<el-col :span="6" v-for="name in nameList" :key="name" style="display: flex; align-items: center; justify-content: center; min-width:28px;">
							<el-avatar :size="28">{{ name }}</el-avatar>
						</el-col>
						<el-col :span="6" style="display: flex; align-items: center; border-left: 1px solid var(--el-border-color); padding-left: 12px; min-width:44px;">
							<el-avatar :size="32" :src="circleUrl">Xu</el-avatar>
						</el-col>
					</el-row>
				</div>
			</header>
			<!--主界面-->
			<div class="main">
				<!--左侧边栏-->
				<div class="left-sidebar" :class="isLayerout ? 'show' : 'hide'">
					<!--图层面板-->
					<div class="layer-panel">
						图层面板
					</div>
					<!--按钮栏-->
					<div class="button-container">
						<div class="block" style="margin-top: 10vh;">
							<el-button type="plain">
								<svg-icon name="xiangmu" />
							</el-button>
						</div>

						<div class="block">
							<el-button-group>
								<el-button type="plain" @click="editor">
									<svg-icon name="xuanze" />
								</el-button>
								<el-button type="plain" @click="move">
									<svg-icon name="move" />
								</el-button>
								<el-dropdown trigger="click" placement="right">
									<el-button type="plain" style="border-radius:0px;">
										<svg-icon name="xingzhuang" />
									</el-button>
									<template #dropdown>
										<el-dropdown-menu>
											<el-dropdown-item @click.native="">矩形</el-dropdown-item>
											<el-dropdown-item @click.native="">圆形</el-dropdown-item>
											<el-dropdown-item @click.native="">三角形</el-dropdown-item>
										</el-dropdown-menu>
									</template>
								</el-dropdown>
								<el-button type="plain">
									<svg-icon style=" width: 22px; height: 22px;" name="wenben" />
								</el-button>
								<el-dropdown trigger="click" placement="right">
									<el-button type="plain" style="border-radius:0px;">
										<svg-icon name="quxian" />
									</el-button>
									<template #dropdown>
										<el-dropdown-menu>
											<el-dropdown-item @click.native="addStraightLine">添加直线</el-dropdown-item>
											<el-dropdown-item @click.native="addCurve">添加曲线</el-dropdown-item>
											<el-dropdown-item @click.native="deleteLine">删除线段</el-dropdown-item>
											<el-dropdown-item @click.native="deletePoint">删除点</el-dropdown-item>
										</el-dropdown-menu>
									</template>
								</el-dropdown>
								<el-button type="plain">
									<svg-icon style=" width: 30px; height: 30px;" name="celiang" />
								</el-button>
							</el-button-group>
						</div>

						<div class="block">
							<el-button-group style=" display: flex; flex-direction: column;">
								<el-button type="plain">
									<svg-icon name="wenzi" />
								</el-button>
								<el-button type="plain" @click="mark">
									<svg-icon style=" width: 32px; height: 32px; transform: translateX(-2px);" name="taolun" />
								</el-button>
							</el-button-group>
						</div>

						<div class="block" style="margin-top: 10vh;">
							<el-button type="plain" @click="toggleLayer">
								<svg-icon style=" width: 30px; height: 30px;" name="tuceng" />
							</el-button>
						</div>

					</div>
				</div>
				<!--字体编辑画布-->
				<div id="canvas" @mouseenter="changeActive($event)" @mouseleave="removeActive($event)"></div>

				<!--底部栏-->
				<div class="footer">
					Footer
				</div>
			</div>

			<!--右侧边栏-->
			<aside class="right-sidebar">
				<p>信息栏</p>
				<el-button type="primary" @click="importSVG"> 导入SVG </el-button>
				<el-button type="primary" @click="exportSVG"> 导出SVG </el-button>
			</aside>
		</div>
	</div>
</template>

<script lang="ts">
	import { ArrowDown } from '@element-plus/icons-vue'
	import { defineComponent, ref, onMounted } from 'vue'
	import { ElScrollbar } from 'element-plus'
	import SvgEditor from '../lib/svg-editor/SvgEditor'
	import { useRouter } from 'vue-router'
	import router from '@/router'
	const scrollbarRef = ref < InstanceType < typeof ElScrollbar >> ()
	let svgEditor: SvgEditor | undefined

	const ws = new WebSocket('ws://localhost:8000');

	export default defineComponent({

		components: {
			ArrowDown,

		},

		data() {
			return {
				nameList: ['小张', '小明', '小华'],
				isLayerout: false,

				showInputBox: false,
				showInputBox2: false,
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
				comment: "1",
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
			toggleLayer() {
				this.isLayerout = !this.isLayerout
			},
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
			mark() {
				svgEditor?.setTool('mark')
			},
			editComment(id: number) {
				svgEditor!.markedId = id
				svgEditor!.ifMarked = true
			},
			deleteComment(id: number) {
				// svgEditor!.unMark(this.markedId)
				svgEditor?.markComment(this.markedId, "")
				svgEditor!.ifSend = 1
				// this.markedId =
			},
			submitInput() {
				console.log(this.inputValue.length);
				if (this.inputValue.length == 0) {
					// console.log("输入不能为空")
					svgEditor!.unMark(this.markedId)
					svgEditor?.markComment(this.markedId, this.inputValue)
					return
				}
				console.log(this.markedId)
				svgEditor?.markComment(this.markedId, this.inputValue)
				// console.log("wozaisubmit",this.ifSend)
				svgEditor!.ifSend = 1
				// 隐藏输入框
				this.inputValue = ""
				svgEditor!.ifMarked = false
				// this.showInputBox=false;
			},
			submitInput2() {
				console.log(this.inputValue.length);
				if (this.inputValue.length == 0) {
					console.log("输入不能为空")
					// svgEditor!.unMark(this.markedId)
					// svgEditor?.markComment(this.markedId,this.inputValue)
					return
				}
				svgEditor?.markOnCanvas(svgEditor.markPoint.x, svgEditor.markPoint.y, this.inputValue)
				svgEditor!.ifSend = 1
				// 隐藏输入框
				this.inputValue = ""
				svgEditor!.ifMarkedCanvas = false
				// this.showInputBox=false;
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
				const msg = JSON.parse(e.data.toString());
				// console.log(msg)
				// console.log('FE:WebSocket:message',msg.msg)
				this.list = []
				for (let i = 0; i < msg.cmt.length; i++) {
					console.log("111")
					// let element = msg.cmt[i]
					// element!.comment = msg.cmt[i]
					var mark: any = { gui_id: msg.cmt[i], gui_mark: msg.cmt[i + 1] }
					i++
					this.list.push(mark)
				}
				if (svgEditor)
					svgEditor.acceptSVG(msg.svg, msg.cmt)
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
							console.log("我是vue里的comment", comment)
							let segment = svgEditor.transSVG()
							// console.log("我是vue里的segment",segment)
							ws.send(JSON.stringify({
								id: new Date().getTime(),
								user: this.username,
								svg: segment,
								cmt: comment
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
	.el-link {
		margin-right: 8px;
		font-size: 16px;
	}

	.el-dropdown-link {
		margin-top: 4px;
		margin-left: 4px;
		font-size: 16px;
	}

	.main .el-button {
		width: 45px;
		height: 45px;
		border-radius: 10px;
	}

	.el-button-group {
		display: flex;
		flex-direction: column;
		border-radius: 10px;
	}

		.el-button-group > .el-button:first-child {
			border-bottom-right-radius: 0;
			border-bottom-left-radius: 0;
			border-top-right-radius: 10px;
		}

		.el-button-group > .el-button:last-child {
			border-bottom-left-radius: 10px;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

	.el-icon {
		color: #2C2C2C;
		font-size: 25px;
	}

	.el-icon--right {
		color: #F1F1F1;
		font-size: 20px;
	}

	#canvas {
		position: absolute;
		width: 100%;
		height: calc(100vh - 52px);
		touch-action: none;
		user-select: none;
	}
</style>
