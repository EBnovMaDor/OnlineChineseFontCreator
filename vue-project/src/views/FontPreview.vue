<template>
	<div class="app-container">
		<div class="flex-container">
			<!--顶栏-->
			<header class="header">
				<!--左边-->
				<div class="left">字库</div>
				<!--中间-->
				<div class="middle">
					<el-link type="info" :underline="false">新宋体字库项目</el-link>
					<span style="color: #909399; font-size:18px">/</span>
					<span style="margin-left: 8px;">字库概览</span>
					<el-dropdown trigger="click"@command="handleCommand">
						<span class="el-dropdown-link">
							<el-icon class="el-icon--right">
								<arrow-down />
							</el-icon>
						</span>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item command="a">转到编辑</el-dropdown-item>
								<el-dropdown-item command="b">转到排版</el-dropdown-item>
								<el-dropdown-item divided command="c">修改字库</el-dropdown-item>
								<el-dropdown-item disabled>删除字库</el-dropdown-item>

							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>

			</header>
			<!--主界面-->
			<div class="main">
				<!--左侧边栏-->
				<div class="left-sidebar">
					<!--字库选择和任务面板-->
					<div class="layer-panel">
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>字库</b>
						</div>
						<div class="task-tree">
							<el-select v-model="selectvalue"
									   multiple
									   clearable
									   collapse-tags
									   collapse-tags-tooltip
									   filterable
									   placeholder="选择预览字库"
									   popper-class="custom-header"
									   :max-collapse-tags="6"
									   style="width: 240px;"
									   @change="handleSelectChange">
								<el-option v-for="item in options"
										   :key="item.value"
										   :label="item.label"
										   :value="item.value" />
							</el-select>
						</div>
						<div style="margin: 10px; text-align: left; font-size: 16px;">
							<b>任务</b>
						</div>
						<div class="layer-tree" style="flex:4;">
							<el-tree style="background-color: #EAEAEA; "
									 :data="tasktreedata"
									 :props="defaultProps"
									 default-expand-all
									 highlight-current
									 :expand-on-click-node="false" />
						</div>
					</div>
				</div>
				<!--右侧主页面-->
				<div class="right-main">
					<div class="font-preview">
						<el-collapse>
							<el-collapse-item v-for="font in selectfonts"
											  :key="font.title"
											  :title="font.title">
								<template #title>
									<b style="margin-left: 10px; font-size: 16px;">{{font.title}}</b>
								</template>
								<template #default>
									<div class="font-preview-block">
										<div v-for="fontcontent in font.content">
											<div v-if="font.title==='十二模板字' || font.title==='GB2312-80'" style="height: 60px; margin-bottom: 0px;">
												<img :src="getImageUrl(font.title,fontcontent)" width="60" height="60" />
											</div>
											<div v-else style="background-color: #909399; height: 50px; width: 50px; margin-bottom: 10px;"></div>
										
											<div>{{fontcontent}}</div>
										</div>
									</div>
									
								</template>
							</el-collapse-item>
						</el-collapse>
					</div>

				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { ArrowDown, Delete, Edit, Plus, View } from '@element-plus/icons-vue'
	import { defineComponent, ref } from 'vue'
	import router from '@/router'
	import type { CheckboxValueType } from 'element-plus'

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

				selectvalue: [] as CheckboxValueType[],

				options: [
					{
						value: '部件库',
						label: '部件库',
					},
					{
						value: '十二模板字',
						label: '十二模板字',
					},
					{
						value: 'GB2312-80',
						label: 'GB2312-80',
					},
					{
						value: '拉丁字母',
						label: '拉丁字母',
					},
					{
						value: '数字',
						label: '数字',
					},
					{
						value: '符号',
						label: '符号',
					},
				],

				fonts: [
					{
						title: '部件库',
						content:[ '1','2',],
					},
					{
						title: '十二模板字',
						content: ['今', '国', '意', '我', '永', '然', '警', '转', '酬', '随', '风','鹰'],
					},
					{
						title: 'GB2312-80',
						content: ['案', '肮', '哀', '皑','氨', '安', '俺', '按', '暗', '岸', '白', '胺', '身', '盃', '啊', '阿', '埃', '挨', '衣', '心', '唉', '哎', '有', '锦', '缎'],
					},
					{
						title: '拉丁字母',
						content: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
					},
					{
						title: '数字',
						content: ['0','1', '2', '3', '4', '5', '6', '7', '8', '9'],
					},
					{
						title: '符号',
						content: [',', '.','。','-','?','!'],
					},
				],

				selectfonts: [{
					title: '',
					content: [''],
				}],

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
		},

		methods: {
			handleSelectChange() {
				this.selectfonts = [];
				for (const font of this.fonts) {
					if (this.selectvalue.includes(font.title)) {
						this.selectfonts.push(font);
					}
				}
			},
			handleCommand(command: any) {
				if (command == 'a')
					router.push('/Test');
				if (command == 'b')
					router.push('/svgPreview');
				if (command == 'c') {

				}
			},
			getImageUrl: (font: string, name: string) => {
				var path = ''
				if (font == '十二模板字') {
					path = 'pre-font1-' + name + '.png'
					return new URL(`../image/${path}`, import.meta.url).href
				}

				else if (font == 'GB2312-80') {
					path = 'pre-font2-' + name + '.png'
					return new URL(`../image/${path}`, import.meta.url).href
				}
				else { return '' }	
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

	.el-icon--right {
		color: #F1F1F1;
		font-size: 20px;
	}
</style>

<style scoped>
	:deep(.el-select__wrapper) {
		background-color: #EAEAEA;
	}
	:deep(.el-collapse-item__arrow){
		margin-right:25px;
		font-size:25px;
	}
</style>
