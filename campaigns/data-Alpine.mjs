import { BLOCK_TYPE, EASING, PROPERTY } from "../types.mjs";

const assetsPrefixUrl =
	"https://statics.dmcdn.net/d/PRODUCTION/2025/POC_CanvasToVideo/assets/alpine/";

export const campaignAlpine = {
	scene: {
		width: 1920,
		height: 1080,
	},
	blocks: [
		{
			type: BLOCK_TYPE.image,
			name: "bg",
			version: "",
			props: {
				src: `${assetsPrefixUrl}bg.png`,
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				opacity: 0,
				zIndex: 0,
				animations: [
					{
						property: PROPERTY.opacity,
						startValue: 0,
						endValue: 1,
						startTime: 400,
						duration: 300,
						repeatDelay: 1000,
					},
				],
			},
		},
		{
			type: BLOCK_TYPE.video,
			name: "video",
			version: "",
			props: {
				src: `${assetsPrefixUrl}video_high.mp4`,
				isMainVideo: true,
				regX: 0.5,
				regY: 0.5,
				x: 1920 * 0.64 * 0.5,
				y: 1080 * 0.64 * 0.5,
				width: 1920 * 0.64,
				height: 1080 * 0.64,
				scale: 0,
				opacity: 1,
				zIndex: 1,
				animations: [
					{
						property: PROPERTY.opacity,
						endValue: 1,
						startTime: 400,
						duration: 300,
					},
					{
						property: PROPERTY.scale,
						endValue: 1,
						startTime: 400,
						duration: 1300,
						easing: EASING.bounceOut,
					},
				],
			},
		},
		{
			type: BLOCK_TYPE.image,
			name: "car",
			version: "",
			props: {
				src: `${assetsPrefixUrl}car.png`,
				x: 860,
				y: 540,
				width: 1075,
				height: 513,
				opacity: 0,
				zIndex: 2,
				animations: [
					{
						property: PROPERTY.opacity,
						startValue: 0,
						endValue: 1,
						startTime: 400,
						duration: 300,
					},
				],
			},
		},
		{
			type: BLOCK_TYPE.image,
			name: "logo",
			version: "",
			props: {
				src: `${assetsPrefixUrl}logo.png`,
				x: 1370,
				y: 100,
				width: 416 * 1,
				height: 79 * 1,
				opacity: 0,
				zIndex: 3,
				animations: [
					{
						property: PROPERTY.opacity,
						startValue: 0,
						endValue: 1,
						startTime: 600,
						duration: 1500,
					},
					{
						property: PROPERTY.x,
						startValue: 1370 + 500,
						endValue: 1370,
						startTime: 600,
						duration: 500,
						easing: EASING.easeOut,
					},
				],
			},
		},
		{
			type: BLOCK_TYPE.image,
			name: "claim",
			version: "",
			props: {
				src: `${assetsPrefixUrl}claim.png`,
				x: 1370,
				y: 200,
				width: 440 * 1,
				height: 117 * 1,
				opacity: 0,
				zIndex: 4,
				animations: [
					{
						property: PROPERTY.opacity,
						endValue: 1,
						startTime: 800,
						duration: 1500,
					},
					{
						property: PROPERTY.x,
						startValue: 1370 + 500,
						endValue: 1370,
						startTime: 800,
						duration: 500,
						easing: EASING.easeOut,
					},
				],
			},
		},
		{
			type: BLOCK_TYPE.image,
			name: "cta",
			version: "",
			props: {
				src: `${assetsPrefixUrl}cta.png`,
				x: 1370,
				y: 370,
				width: 442 * 1,
				height: 76 * 1,
				opacity: 0,
				zIndex: 5,
				animations: [
					{
						property: PROPERTY.opacity,
						startValue: 0,
						endValue: 1,
						startTime: 1500,
						duration: 300,
					},
				],
			},
		},
		// {
		// 	type: ELEMENT_TYPE.text,
		// 	name: "catchPhrase",
		// 	version: "",
		// 	specs: {
		// 		fontUrl: `url(${assetsPrefixUrl}AlpineProto-Bold-LGC.ttf)`,
		// 		text: "Buy me!",
		// 		fontSize: 83,
		// 		fontColor: "white",
		// 		textAlign: TEXT_ALIGN.center,
		// 		x: 1370,
		// 		y: 555,
		// 		zIndex: 6,
		// 	},
		// },
	],
};
