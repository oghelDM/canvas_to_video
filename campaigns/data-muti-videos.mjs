import { BLOCK_TYPE, EASING, PROPERTY } from "../types.mjs";

const assetsPrefixUrl =
	"https://statics.dmcdn.net/d/PRODUCTION/2025/POC_CanvasToVideo/assets/multiVideos/";

export const campaignMultiVideos = {
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
				src: `${assetsPrefixUrl}alpine.mp4`,
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
			type: BLOCK_TYPE.video,
			name: "video2",
			version: "",
			props: {
				src: `${assetsPrefixUrl}maif.mp4`,
				regX: 1,
				regY: 1,
				x: 1920,
				y: 1080,
				width: 1920 * 0.4,
				height: 1080 * 0.4,
				scale: 1,
				opacity: 1,
				zIndex: 1,
				animations: [],
			},
		},
	],
};
