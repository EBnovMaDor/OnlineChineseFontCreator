<template>
	<div class="div">
		<el-container>
			<el-main>
				<div class="rectangle-8">
					<div class="rectangle-5"></div>
					<div class="logo">logo</div>
				</div>

				<div class="div3">现代中文字库设计系统</div>
				<div class="div4"><el-button type="primary" @click="importUserLogin"> 用户登录 </el-button></div>
				<div class="div5"><el-button type="primary" @click="importNonUserLogin"> 访客登录 </el-button></div>
			</el-main>
			<el-footer>
				<div class="rectangle-4"></div>
				<div class="div2">关于我们</div>
			</el-footer>
		</el-container>
	</div>
</template>
<script lang="ts">
	import router from '@/router'

    export default {
        name: "Home",
		data() {
			return {}
		},

		mounted() { },

		methods: {
			importUserLogin() {
				router.push('/svg');
			},
			importNonUserLogin() {
				router.push('/Test');
			}
		}
	};
	
</script>
<style scoped>


	.rectangle-8 {
		background: #d9d9d9;
		width: 100vw;
		height: 100vh;
		position: absolute;
		left: 0px;
		top: 0px;
	}

    .rectangle-4 {
        background: #999999;
        width: 100vw;
        height: 10vh;
        position: absolute;
        left: 0px;
        bottom: 0px;
    }

	.div2 {
		color: #333333;
		text-align: left;
		font-size: 24px;
		font-weight: 400;
		position: absolute;
		left: 50%;
		top: 95%;
		transform: translate(-50%,-50%);
	}

    .rectangle-5 {
        background: #f5f5f5;
        width: 338px;
        height: 183px;
        position: absolute;
        left: 50%;
        top: 35%;
		transform:translate(-50%,-50%);
    }

	.logo {
		color: #000000;
		text-align: left;
		font-size: 64px;
		font-weight: 400;
		position: absolute;
		left: 50%;
		top: 35%;
		transform: translate(-50%,-50%);
	}

	.div3 {
		color: #000000;
		text-align: left;
		font-size: 32px;
		font-weight: 400;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%,-50%);
	}

	.div4 {
		color: #000000;
		text-align: left;
		font-size: 14px;
		font-weight: 400;
		position: absolute;
		left: 45%;
		top: 65%;
		transform: translate(-50%,-50%);
	}

	.div5 {
		color: #000000;
		text-align: left;
		font-size: 14px;
		font-weight: 400;
		position: absolute;
		left: 55%;
		top: 65%;
		transform: translate(-50%,-50%);
	}
</style>
