<template>
	<div class="app-container">
		<div class="flex-container">
			<!--顶栏-->
			<header class="header">
				<!--左边-->
				<div class="left">排版</div>
				<!--中间-->
				<div class="middle">
					<el-link type="info" :underline="false">新宋体字库项目</el-link>
					<span style="color: #909399; font-size:18px">/</span>
					<span style="margin-left: 8px;">排版测试</span>
					<el-dropdown trigger="click">
						<span class="el-dropdown-link">
							<el-icon class="el-icon--right">
								<arrow-down />
							</el-icon>
						</span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item>转到编辑</el-dropdown-item>
								<el-dropdown-item divided>转到字库</el-dropdown-item>

							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
			</header>
			<!--主界面-->
			<div class="main">
				<!--左侧边栏-->
				<div class="left-sidebar">
					<!--排版设置和测试字面板-->
					<div class="layer-panel">
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>设置</b>
						</div>
						<div class="task-tree">
							<div class="slider-block">
								<span class="demonstration">字间距值</span>
								<el-slider v-model="wordSpacing" show-input size="small" />
							</div>
							<div class="slider-block">
								<span class="demonstration">行间距值</span>
								<el-slider v-model="lineSpacing" show-input size="small" />
							</div>
							<div class="slider-block" style="padding-bottom:0px;">
								<span class="demonstration">字号</span>
								<el-slider v-model="fontSize" :min="1" :max="20" show-input size="small" />
							</div>

						</div>
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>测试字符</b>
						</div>
						<div class="layer-tree" style="flex:3;">
							<div style="padding:5px 5px 20px 5px; border-bottom: 2px solid #D9D9D9; text-align:right; ">
								<el-input type="textarea" resize="none" placeholder="请输入测试字符" v-model="word" style="margin-bottom:10px ;width: 240px;" :rows="6">
								</el-input>
								<el-button type="primary" size="small" @click="sendMessage" plain> 确认 </el-button>
								<el-button type="primary" size="small" @click="typesetting" plain> 排版 </el-button>
							</div>
							<div style="margin: 10px; margin-bottom: 20px; text-align: left; font-size: 16px;">
								<b>测试模板</b>
							</div>
							<el-button v-for="button in buttons" :key="button" text bg class="wrap-botton" @click="setModelText(button)">
								{{ button }}
							</el-button>
							<el-button @click="setRandomText">随机乱文</el-button>
						</div>
					</div>
				</div>
				<!--右侧主页面-->
				<div class="right-main">
					<div class="mousetest" id="preview" style="width:100%; height: 100%;"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent, ref, onMounted } from 'vue'
	import { ArrowDown } from '@element-plus/icons-vue'
	import { ElScrollbar } from 'element-plus'
	import SvgPreviewer from '../lib/svg-preview/SvgPreviewer'
	import { useRouter } from 'vue-router'
	import router from '@/router'
	import lorem from '../outerlib/lorem-cn'
	const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()
	let svgPreviewer: SvgPreviewer | undefined

	const ws = new WebSocket('ws://localhost:8000');

	export default defineComponent({
		components: {
			ArrowDown,

		},
		data() {
			return {
				wordSpacing: '',
				lineSpacing: '',
				fontSize: '',
				svgPreviewer: undefined as SvgPreviewer | undefined,
				username: '',
				word: "",
				font: "font_1",
				buttons: [
					"今国意我永然警转酬随风鹰",
					"the quick brown fox jumps \nover the lazy dog",
					"行路难！行路难！多歧路，今安在？\n长风破浪会有时，直挂云帆济沧海。",
					"1. Hello,How are you?\n2. 我很好，谢谢！"
				],
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
				svgPreviewer!.typeSetting(this.wordSpacing, this.lineSpacing, this.fontSize)
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
			setModelText(modeltext: any) {
				this.word = modeltext
			},
			setRandomText() {
				this.word = lorem(Math.floor(Math.random() * 40) + 40)
			}
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

	.el-icon--right {
		color: #F1F1F1;
		font-size: 20px;
	}

	#preview {
		touch-action: none;
		user-select: none;
	}

	.slider-block {
		max-width: 600px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding: 0 20px 10px 10px;
	}

		.slider-block .el-slider {
			margin-top: 5px;
			margin-left: 0px;
		}

		.slider-block .demonstration {
			font-size: 14px;
			color: var(--el-text-color-secondary);
			line-height: 24px;
			text-align: left;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			margin-bottom: 0;
		}

			.slider-block .demonstration + .el-slider {
				flex: 0 0 100%;
			}

	.wrap-botton {
		white-space: pre;
		width: 240px;
		min-height: 50px;
		margin-left: 0px !important;
		margin-bottom: 10px;
	}
</style>
<style scoped>
	:deep(.el-slider__input) {
		width: 100px;
		margin-top: 5px;
		position: relative;
		top: -32px;
		right: 90px;
	}

	:deep(.el-slider__runway.show-input) {
		margin-right: 0px;
		margin-left: 5px;
		flex: 0 0 100%;
	}
</style>
