export const TEXT_ALIGN = {
	left: "left",
	right: "right",
	center: "center",
};

export const BLOCK_TYPE = {
	image: "image",
	video: "video",
	audio: "audio",
	text: "text",
	circle: "circle",
	rectangle: "rectangle",
};

export const PROPERTY = {
	x: "x",
	y: "y",
	scale: "scale",
	opacity: "opacity",
	volume: "volume",
	// rotation : "rotation",
	// regX : "regX",
	// regY : "regY",
};

// add animationRepeat,

export const defaultPropertyValues = {
	opacity: 1,
	scale: 1,
	x: 0,
	y: 0,
	regX: 0,
	regY: 0,
	lineWidth: 1,
	volume: 1,
};

export const EASING = {
	linear: "linear",
	easeIn: "easeIn",
	easeOut: "easeOut",
	easeInOut: "easeInOut",
	elasticIn: "elasticIn",
	elasticOut: "elasticOut",
	elasticInOut: "elasticInOut",
	bounceIn: "bounceIn",
	bounceOut: "bounceOut",
	bounceInOut: "bounceInOut",
};

// export type Campaign = {
// 	scene: {
// 		width: 1920;
// 		height: 1080;
// 		// aspectRatio: 16 / 9,
// 		// template: "",
// 	};
// 	blocks: Block[];
// };

// type BlockBase = {
// 	type: BLOCK_TYPE;
// 	name: string;
// 	version: string;
// 	props: PropsBase;
// };

// export type PropsBase = {
// 	x: number;
// 	y: number;
// 	zIndex: number;
// 	scale?: number;
// 	opacity?: number;
// 	regX?: number; // 0 to 1
// 	regY?: number; // 0 to 1
// 	animations?: Animation[];
// };

// export type PropsImage = PropsBase & {
// 	src: string;
// 	width: number;
// 	height: number;
// };

// export type PropsVideo = PropsImage & {
// 	volume?: number; // NEW: Initial volume (0 to 1)
// 	isMainVideo?: boolean; // NEW: Flag to identify timing source
// 	startOffset?: number; // NEW: Delay in ms relative to main video
// 	// loop?: boolean; // NEW: Loop the media
// 	// fadeIn?: number; // NEW: Fade in duration in ms
// 	// fadeOut?: number; // NEW: Fade out duration in ms
// };

// export type PropsAudio = PropsBase & {
// 	src: string;
// 	volume?: number;
// 	startOffset?: number;
// 	// loop?: boolean;
// 	fadeIn?: number;
// 	fadeOut?: number;
// };

// export type PropsShape = PropsBase & {
// 	stroke?: string;
// 	fill?: string;
// 	lineWidth?: number;
// };

// export type PropsRectangle = PropsShape & {
// 	width: number;
// 	height: number;
// };

// export type PropsCircle = PropsShape & {
// 	radius: number;
// };

// type PropsText = {
// 	text: string;
// 	textAlign?: TEXT_ALIGN;
// 	fontUrl?: string;
// 	fontSize: number;
// 	fontColor?: string;
// };

// export type BlockImage = BlockBase & {
// 	type: BLOCK_TYPE.image;
// 	props: PropsImage;
// };

// export type BlockVideo = BlockBase & {
// 	type: BLOCK_TYPE.video;
// 	props: PropsVideo;
// };

// export type BlockAudio = BlockBase & {
// 	type: BLOCK_TYPE.audio;
// 	props: PropsAudio;
// };

// export type BlockText = BlockBase & {
// 	type: BLOCK_TYPE.text;
// 	props: PropsBase & PropsText;
// };

// export type BlockCircle = BlockBase & {
// 	type: BLOCK_TYPE.circle;
// 	props: PropsCircle;
// };

// export type BlockRectangle = BlockBase & {
// 	type: BLOCK_TYPE.rectangle;
// 	props: PropsRectangle;
// };

// export type BlockShape = BlockCircle | BlockRectangle;

// export type Block =
// 	| BlockImage
// 	| BlockVideo
// 	| BlockAudio
// 	| BlockText
// 	| BlockShape;

// export type Animation = {
// 	property: PROPERTY;
// 	startTime: number; // in milliseconds
// 	duration: number; // in milliseconds
// 	startValue?: number; // if not present, then take the current value
// 	endValue: number;
// 	easing?: EASING;
// 	count?: number;
// 	repeatDelay?: number; // in milliseconds, pause between the previous iteration and the next one
// 	// startAfter?: string;
// };
