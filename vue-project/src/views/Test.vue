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
					<el-dropdown trigger="click" @command="handleCommand">
						<span class="el-dropdown-link">
							<el-icon class="el-icon--right">
								<arrow-down />
							</el-icon>
						</span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item command="a">转到字库</el-dropdown-item>
								<el-dropdown-item command="b">转到排版</el-dropdown-item>
								<el-dropdown-item command="c" divided>修改任务</el-dropdown-item>

							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
				<!--用户-->
				<div class="right">
					<el-row :gutter="0" style="margin-right:0; width:200px;">
						<el-col :span="6" v-for="name in nameList" :key="name"
							style="display: flex; align-items: center; justify-content: center; min-width:28px;">
							<el-avatar :style="{ 'background-color': extractColorByName(name) }" :size="28">{{ name
								}}</el-avatar>
						</el-col>
						<el-col :span="6"
							style="display: flex; align-items: center; border-left: 1px solid var(--el-border-color); padding-left: 12px; min-width:44px;">
							<el-avatar :style="{ 'background-color': extractColorByName('Xu') }"
								:size="32">Xu</el-avatar>
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
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>任务</b>
						</div>
						<div class="task-tree">
							<el-tree style="background-color: #EAEAEA; " :data="tasktreedata" :props="defaultProps"
								default-expand-all highlight-current :expand-on-click-node="false" />
						</div>
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>图层</b>
						</div>
						<div class="layer-tree">
							<el-tree style="background-color: #EAEAEA; " :data="layertreedata" :props="defaultProps"
								node-key="id" default-expand-all highlight-current :expand-on-click-node="false">
								<template #default="{ node, data }">
									<span class="custom-tree-node">
										<span>{{ node.label }}</span>
										<span>
											<el-button style="right:10px" v-if="data.id === 1" type="text" circle
												size="mini" @click="addNode(node, data)">
												<el-icon class="el-icon--small">
													<Plus />
												</el-icon>
											</el-button>
											<el-button v-if="data.id !== 1" type="text" circle size="mini"
												@click="hideNode(node, data)">
												<el-icon class="el-icon--small">
													<View />
												</el-icon>
											</el-button>
											<el-button v-if="data.id !== 1" style="margin:0px;" type="text" circle
												size="mini" @click="removeNode(node, data)">
												<el-icon class="el-icon--small">
													<Delete />
												</el-icon>
											</el-button>
										</span>
									</span>
								</template>
							</el-tree>
						</div>
					</div>
					<!--按钮栏-->
					<div class="button-container">
						<!--项目按钮-->
						<div class="block" style="margin-top: 10vh;">
							<el-button type="plain">
								<svg-icon name="xiangmu" />
							</el-button>
						</div>

						<div class="block">
							<el-button-group>
								<!--选择按钮-->
								<el-popover placement="right" title="选择" :width="230" trigger="hover" show-after="1000"
									content="选择点与任意曲线。点击选中并进行修改，按住并拖动进行框选">
									<template #reference>
										<el-button type="plain" @click="editor">
											<svg-icon name="xuanze" />
										</el-button>
									</template>
								</el-popover>
								<!--移动按钮-->
								<el-popover placement="right" title="移动" :width="230" trigger="hover" show-after="1000"
									content="按住鼠标左键以拖动画布">
									<template #reference>
										<el-button type="plain" @click="move">
											<svg-icon name="move" />
										</el-button>
									</template>
								</el-popover>
								<!--形状按钮-->
								<el-popover placement="right" title="形状工具" :width="230" trigger="hover"
									show-after="1000" content="绘制矩形、圆形、三角形。按住并拖动以绘制对应大小的形状">
									<template #reference>
										<el-dropdown trigger="click" placement="right">
											<el-button type="plain" style="border-radius:0px;">
												<svg-icon name="xingzhuang" />
											</el-button>
											<template #dropdown>
												<el-dropdown-menu>
													<el-dropdown-item @click.native="addRectangle">矩形</el-dropdown-item>
													<el-dropdown-item @click.native="addCircle">圆形</el-dropdown-item>
													<el-dropdown-item @click.native="addTriangle">三角形</el-dropdown-item>
												</el-dropdown-menu>
											</template>
										</el-dropdown>
									</template>
								</el-popover>
								<!--文本按钮-->
								<el-popover placement="right" title="文本" :width="230" trigger="hover" show-after="1000"
									content="生成指定文字。在点击处进行输入，点击输入框外部完成输入，ESC取消">
									<template #reference>
										<el-button type="plain" @click="markText">
											<svg-icon style=" width: 22px; height: 22px;" name="wenben" />
										</el-button>
									</template>
								</el-popover>
								<!--曲线按钮-->
								<el-popover placement="right" title="曲线工具" :width="230" trigger="hover"
									show-after="1000" content="添加与删除任意点与曲线。按住并拖动进行添加，点击进行删除">
									<template #reference>
										<el-dropdown trigger="click" placement="right">
											<el-button type="plain" style="border-radius:0px;">
												<svg-icon name="quxian" />
											</el-button>
											<template #dropdown>
												<el-dropdown-menu>
													<el-dropdown-item
														@click.native="addStraightLine">添加直线</el-dropdown-item>
													<el-dropdown-item @click.native="addCurve">添加曲线</el-dropdown-item>
													<el-dropdown-item @click.native="deleteLine">删除线段</el-dropdown-item>
													<el-dropdown-item @click.native="deletePoint">删除点</el-dropdown-item>
												</el-dropdown-menu>
											</template>
										</el-dropdown>
									</template>
								</el-popover>
								<!--测量按钮-->
								<el-popover placement="right" title="测量" :width="230" trigger="hover" show-after="1000"
									content="测量点与任意曲线。点击选中以显示相关数据">
									<template #reference>
										<el-button type="plain" @click="ruler">
											<svg-icon style=" width: 30px; height: 30px;" name="celiang" />
										</el-button>
									</template>
								</el-popover>
							</el-button-group>
						</div>

						<div class="block">
							<el-button-group style=" display: flex; flex-direction: column;">
								<!--标注按钮-->
								<el-popover placement="right" title="标注" :width="230" trigger="hover" show-after="1000"
									content="标注点与任意曲线。点击选中以标注点，按住并拖动以标注线">
									<template #reference>
										<el-button type="plain" @click="shapeMark">
											<svg-icon name="wenzi" />
										</el-button>
									</template>
								</el-popover>
								<!--讨论按钮-->
								<el-popover placement="right" title="讨论" :width="230" trigger="hover" show-after="1000"
									content="对点与任意曲线标注讨论。点击选中后于右侧添加讨论">
									<template #reference>
										<el-button type="plain" @click="mark">
											<svg-icon style=" width: 32px; height: 32px; transform: translateX(-2px);"
												name="taolun" />
										</el-button>
									</template>
								</el-popover>
							</el-button-group>
						</div>

						<div class="block" style="margin-top: 10vh;">
							<!--图层按钮-->
							<el-popover placement="right" title="展开" :width="230" trigger="hover" show-after="1000"
								content="展开左侧图层任务面板">
								<template #reference>
									<el-button type="plain" @click="toggleLayer">
										<svg-icon style=" width: 30px; height: 30px;" name="tuceng" />
									</el-button>
								</template>
							</el-popover>
						</div>

					</div>
				</div>
				<img :src="getImageUrl(img)" width="578" height="488" style="position:fixed; top:30px;left:100px;" />
				<!--字体编辑画布-->
				<div id="canvas"></div>

				<!--底部栏-->
				<div class="footer">
					<!-- <div class="preview"> -->
					<div id="preview" style="width: 800px; height: 400px;margin-top:20px;"></div>
					<!-- </div> -->

				</div>
			</div>

			<!--右侧边栏-->
			<aside class="right-sidebar">
				<div class="rsidebar-top">
					<div style="margin: 0 0 5px; text-align: left; font-size: 16px;">
						<b>讨论</b>
					</div>
					<div v-for="item in list" :key="item.gui_id">
						<div :class="(item.gui_id == markedId && showInputBox == true) ? 'back-edit' : 'back-normal'"
							@mouseenter="markShow(item.gui_id)" @mouseleave="markHide(item.gui_id)">
							<div>
								<!--元素编号：{{ item.gui_id }}<br />-->
								{{ item.gui_mark }}
							</div>
							<div style="margin-top:5px;">
								<el-button type="primary" size="small" circle @click="editComment(item.gui_id)">
									<el-icon class="el-icon--small">
										<edit />
									</el-icon>
								</el-button>
								<el-button type="danger" size="small" circle @click="deleteComment(item.gui_id)">
									<el-icon class="el-icon--small">
										<delete />
									</el-icon>
								</el-button>
							</div>
						</div>
					</div>
				</div>
				<div class="rsidebar-main">
					<div style="margin: 5px 0 5px; text-align: left; font-size: 16px;">
						<b>信息</b>
					</div>
					<div v-if="pointPos"><br /> 点的坐标:<br /> x: {{ formatNumber(pointx1) }}, y:{{ formatNumber(pointy1)
						}}</div>
					<div v-if="linePos">
						<br /> 直线的两点坐标:<br /> (x1: {{ formatNumber(pointx1) }}, y1:{{ formatNumber(pointy1) }})
						<br /> (x2:{{ formatNumber(pointx2) }}, y2:{{ formatNumber(pointy2) }}) <br /><br /> 直线的长度 :
						{{ formatNumber(length1) }}
						<br /><br /> 线的角度: {{ angle1 }}度
					</div>
					<div v-if="curvePos">
						<br /> 曲线的两点坐标: <br /> (x1: {{ formatNumber(pointx1) }}, y1:{{ formatNumber(pointy1) }})<br />
						(x2: {{ formatNumber(pointx2) }}, y2:{{ formatNumber(pointy2) }})<br /><br />
						控制线长度：{{ formatNumber(length1)
						}} ;
						{{ formatNumber(length2) }} <br /> <br />线的角度: {{ angle1 }} 度 ; {{ angle2 }}度
					</div>
				</div>
				<div class="rsidebar-bottom">
					<div style="margin: 10px 0 10px; text-align: left; font-size: 16px;"><b>按钮</b></div>
					<el-button type="primary" @click="importSVG"> 导入SVG </el-button>
					<el-button type="primary" @click="importSVG"> 导出SVG </el-button>
				</div>

			</aside>
		</div>

		<!--上图层，用于创建文本框与标注-->
		<div v-show="showInputBox2 || showInputBox" class="upperlayer">
			<!--文本输入框 esc取消 点击外部提交-->
			<div class="textinputbar" v-if="showInputBox2"
				v-bind:style="{ left: mouseTextPos.x + 'px', top: mouseTextPos.y + 'px' }">
				<el-input v-model="inputValue" @blur="submitInput2" @keyup.esc="cancelInput2" style="width: 200px"
					:autosize="{ minRows: 2, maxRows: 10 }" type="textarea" placeholder="请输入" />
			</div>
			<!--讨论输入框 esc取消 点击外部提交-->
			<div class="textinputbar" v-if="showInputBox"
				v-bind:style="{ left: mousecommentPos.left + 'px', top: mousecommentPos.top + 'px' }">
				<el-input v-model="inputValue" @blur="submitInput" @keyup.esc="cancelInput" style="width: 200px"
					:autosize="{ minRows: 2, maxRows: 10 }" type="textarea" placeholder="请输入" />
			</div>
		</div>

	</div>
</template>

<script lang="ts">
import { ArrowDown, Delete, Edit, Plus, View } from '@element-plus/icons-vue'
import { defineComponent, ref, onMounted, withScopeId } from 'vue'
import { ElScrollbar } from 'element-plus'
import SvgEditor from '../lib/svg-editor/SvgEditor'
import SvgPreviewer from '../lib/svg-preview/SvgPreviewer'
import { useRouter } from 'vue-router'
import router from '@/router'
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()
let svgEditor: SvgEditor | undefined
let svgPreviewer: SvgPreviewer | undefined
let idcount = 10
const ws = new WebSocket('ws://localhost:8000');
declare var require: any

export default defineComponent({

	components: {
		ArrowDown,
		Delete,
		Edit,
		Plus,
		View,
	},

	data() {
		return {
			nameList: ['小明', 'Li', '华'],
			isLayerout: false,

			showInputBox: false,
			showInputBox2: false,
			mouseTextPos: { x: 0, y: 0 },
			mousecommentPos: { left: 0, top: 0 },
			inputValue: "",
			currentTool: "move",
			svgEditor: undefined as SvgEditor | undefined,
			username: '',
			ifSend: 0,
			markedId: -1,
			comment: "1",
			list: [] as any,
			marklist: [] as any,
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
			font: "font_1",
			word: "今",
			img: '1.png',
			previewString: "今国意我永然警转酬随风鹰",
			previewcnt: 0,
			getImageUrl: (name: string) => {
				return new URL(`../image/${name}`, import.meta.url).href
			},
			defaultProps: {
				children: 'children',
				label: 'label',
			},
			layertreedata: [
				{
					id: 1,
					label: '图层',
					children: [
						{
							id: 2,
							label: 'Regular',
							children: []
						},
						{
							id: 3,
							label: 'Bold',
							children: []
						},
						{
							id: 4,
							label: 'Light',
							children: []
						},
					]
				}
			],

			tasktreedata: [
				{
					id: 1,
					label: '中文',
					children: [
						{
							id: 3,
							label: '十二模板字',
							children: [
								{
									id: 8,
									label: '今',
								},
								{
									id: 9,
									label: '我',
								},
								{
									id: 10,
									label: '大',
								},
							],
						},
						{
							id: 4,
							label: 'GB2312-80',
							children: [
								{
									id: 11,
									label: '组一 （1/30）',
								},
								{
									id: 12,
									label: '组二 （0/30）',
								},
							],
						},
					],

				},
				{
					id: 2,
					label: '西文字符',
					children: [
						{
							id: 5,
							label: '拉丁字母',
						},
						{
							id: 6,
							label: '数字',
						},
						{
							id: 7,
							label: '符号',
						},
					],
				},
			]
		}
	},
	mounted() {
		svgEditor = new SvgEditor('canvas')
		svgPreviewer = new SvgPreviewer('preview')
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
		formatNumber(num: any) {
			return parseFloat(num).toFixed(2);
		},
		//由用户名字生成颜色
		extractColorByName(name: any) {
			var temp = [];
			temp.push("#");
			for (let index = 0; index < name.length; index++) {
				temp.push(parseInt(name[index].charCodeAt(0), 10).toString(16));
			}
			return temp.slice(0, 5).join('').slice(0, 4);
		},
		importSVG() {
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
		addRectangle() {
			svgEditor?.setTool('addRectangle')
		},
		addCircle() {
			svgEditor?.setTool('addCircle')
		},
		addTriangle() {
			svgEditor?.setTool('addTriangle')
		},
		deleteMark() {
			svgEditor?.setTool('deleteMark')
		},
		ruler() {
			svgEditor?.setTool('ruler')
		},
		mark() {
			svgEditor?.setTool('mark')
		},
		shapeMark() {
			svgEditor?.setTool('shapeMark')
		},
		markText() {
			svgEditor?.setTool('markText')
		},
		calCommentPos() {
			const foundmark = this.marklist.find((mark: any) => mark.id === this.markedId)
			if (foundmark) {
				this.mousecommentPos.left = foundmark.pos.x
				this.mousecommentPos.top = foundmark.pos.y
			}
			else {
				this.mousecommentPos.left = this.mouseTextPos.x
				this.mousecommentPos.top = this.mouseTextPos.y
			}
		},
		editComment(id: number) {
			svgEditor!.markedId = id
			svgEditor!.ifMarked = true
		},
		deleteComment(id: number) {
			svgEditor?.markComment(id, "")
			svgEditor!.ifSend = 1
			this.marklist = this.marklist.filter((v: any) => v.id !== id)
		},
		//讨论
		submitInput() {
			if (this.inputValue.length == 0) {
				svgEditor!.unMark(this.markedId)
				svgEditor?.markComment(this.markedId, this.inputValue)
				return
			}
			svgEditor?.markComment(this.markedId, this.inputValue)
			//记录提交时讨论位置
			var markpos: any = { id: this.markedId, pos: this.mouseTextPos }
			this.marklist.push(markpos)
			svgEditor!.ifSend = 1
			// 隐藏输入框
			this.inputValue = ""
			svgEditor!.ifMarked = false
			//设置回选择工具
			svgEditor?.setTool('editor')
		},
		cancelInput() {
			// 隐藏输入框
			this.inputValue = ""
			svgEditor!.ifMarked = false
			//设置回选择工具
			svgEditor?.setTool('editor')
		},
		//文本
		submitInput2() {
			if (this.inputValue.length == 0) {
				return
			}
			svgEditor?.markOnCanvas(svgEditor.markPoint.x, svgEditor.markPoint.y, this.inputValue)
			svgEditor!.ifSend = 1
			// 隐藏输入框
			this.inputValue = ""
			svgEditor!.ifMarkedCanvas = false
			//设置回选择工具
			svgEditor?.setTool('editor')
		},
		cancelInput2() {
			// 隐藏输入框
			this.inputValue = ""
			svgEditor!.ifMarkedCanvas = false
			//设置回选择工具
			svgEditor?.setTool('editor')
		},
		markShow(id: number) {
			svgEditor!.Mark(id)
		},
		markHide(id: number) {
			svgEditor!.unMark(id)
		},
		//图层管理

		addNode(node: any, data: any) {
			// 添加子节点
			data.children.push({
				id: idcount++,
				label: `图层 ${data.children.length + 1}`,
				children: []
			});
		},
		removeNode(node: any, data: any) {
			// 删除子节点
			const parent = node.parent;
			parent.data.children = parent.data.children.filter((child: any) => child.id !== data.id);
		},
		hideNode(node: any, data: any) {
			// 隐藏子节点
			data.hidden = true;
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
			if (msg.op == 'editEnd') {
				this.sendPreview()
			}
			else if (msg.op == 'preview' || msg.op == 'previewEnd') {
				if (msg.font == this.font) {
					svgPreviewer!.handleSVG(msg)
					if (msg.op == 'previewEnd') {
						this.previewcnt++;
						if (this.previewcnt == this.previewString.length) {
							this.typesetting()
							this.previewcnt = 0
						}
					}
				}

			}
			else if (msg.font == this.font && msg.word == this.word) {
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
		sendMessage() {
			if (ws.readyState === WebSocket.OPEN) {
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
				ws.send(JSON.stringify({
					op: 'editEnd',
					font: this.font,
					word: this.word
				}))
			} else if (ws.readyState == WebSocket.CONNECTING) {
				ws.addEventListener('open', () => this.sendMessage())
			}
		},
		sendPreview() {

			if (ws.readyState === WebSocket.OPEN) {
				let segment = this.previewString
				svgPreviewer?.refresh()
				for (let i = 0; i < segment.length; i++) {
					let curword = this.previewString[i]
					ws.send(JSON.stringify({
						op: 'preview',
						font: this.font,
						word: curword
					}))
				}
			} else if (ws.readyState == WebSocket.CONNECTING) {
				ws.addEventListener('open', () => this.sendPreview())
			}
		},
		typesetting() {
			svgPreviewer!.update()
			svgPreviewer!.typeSetting("2", "2", "2")// 字间距/行间距/字号
			svgPreviewer!.changeToPreview()
		},
		getInfo() {
			setTimeout(() => {
				this.currentTool = svgEditor!.currentTool
				this.showInputBox = svgEditor?.ifMarked!
				this.showInputBox2 = svgEditor?.ifMarkedCanvas!
				this.mouseTextPos = svgEditor?.textPoint!
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
					this.sendMessage()

				}
				//显示评论输入框时计算位置
				if (this.showInputBox) {
					this.calCommentPos();
				}
				this.getInfo()
			}, 50)
		},
		handleCommand(command: any) {
			if (command == 'a')
				router.push('/font');
			if (command == 'b')
				router.push('/svgPreview');
			if (command == 'c') {

			}
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

.button-container .el-button {
	width: 45px;
	height: 45px;
	border-radius: 10px;
}

.el-button-group {
	display: flex;
	flex-direction: column;
	border-radius: 10px;
}

.el-button-group>.el-button:first-child {
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
	border-top-right-radius: 10px;
}

.el-button-group>.el-button:last-child {
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

.el-icon--small {
	font-size: 14px;
}

#canvas {
	position: absolute;
	width: 100%;
	height: calc(100vh - 52px);
	touch-action: none;
	user-select: none;
	/*background-image: url("../image/image1.png");
		background-size: cover;*/
	/* 图片适应 div 大小 */
}
</style>
