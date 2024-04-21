<script setup>
	import {ref, onMounted,computed } from 'vue'

	const props = defineProps({
		name: {
			type: String,
			required: true,
		},
		color: {
			type: String,
			default:'',
		},
	})
	const iconName = computed(() => `#icon-${props.name}`)
	const svgClass = computed(() => {
		if (props.name) return `svg-icon icon-${props.name}`
		return 'svg-icon'
	})
</script>

<template>
	<svg :class="svgClass" v-bind="$attrs" :style="{color:color}">
		<use :xlink:href="iconName"></use>
	</svg>
</template>

<style scoped>
	.svg-icon {
		width: 25px;
		height: 25px;
		vertical-align:middle;
		fill: currentColor;
		overflow:hidden;
	}
</style>
