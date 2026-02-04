import {
	Block,
	PROPERTY,
	Campaign,
	BlockText,
	PropsBase,
	Animation,
	BLOCK_TYPE,
	BlockImage,
	BlockVideo,
	PropsVideo,
	PropsAudio,
	defaultPropertyValues,
} from "./types.mts";
import { getEasingFunction } from "./easing.mts";
import { map } from "./helper.mts";

export class MyCreative {
	private canvas: HTMLCanvasElement | undefined;
	private ctx: CanvasRenderingContext2D | undefined;
	private raf: number | undefined;
	private mainVideo: HTMLVideoElement;
	// TODO: add this to the existing VideoBlock or smth
	private secondaryVideos: { [src: string]: HTMLVideoElement } = {};

	private mediaRecorder: MediaRecorder | undefined;
	// store the images' HTMLImageElement (no duplicate)
	// TODO: add this to the existing ImageBlock or smth
	private images: { [src: string]: HTMLImageElement } = {};
	private currTime = 0;
	private campaign: Campaign | undefined;
	private recordedChunks: Blob[] = [];
	// store the fonts' family names
	private fontNames: { [fontUrl: string]: string } = {};
	protected gui: any;
	private isLoading = false;
	// audio management
	private audioContext: AudioContext | undefined;
	private audioDestination: MediaStreamAudioDestinationNode | undefined; // where each audio track is added

	constructor(_campaign: Campaign) {
		this.campaign = _campaign;

		this.mainVideo = document.createElement("video");
		this.mainVideo.crossOrigin = "anonymous";
		this.mainVideo.muted = true;
		this.mainVideo.playsInline = true;

		this.setupCanvas();
	}

	private setupCanvas = () => {
		this.canvas = document.createElement("canvas");
		// this.root.parentElement?.appendChild(this.canvas);

		const ctx = this.canvas.getContext("2d");
		if (!ctx) {
			alert("no canvas context found :(");
			return;
		}
		this.ctx = ctx;
	};

	private cleanup = () => {
		this.currTime = 0;
		this.raf = undefined;

		// stop render loop
		if (this.mainVideo && this.raf != undefined) {
			this.mainVideo.cancelVideoFrameCallback(this.raf);
			this.raf = undefined;
		}

		// Stop and unload main video
		if (this.mainVideo) {
			this.mainVideo.pause();
			this.mainVideo.src = "";
			this.mainVideo.load();
		}

		// Stop and unload secondary videos
		Object.values(this.secondaryVideos).forEach((video) => {
			video.pause();
			video.src = "";
			video.load();
		});
		this.secondaryVideos = {};

		// clear images
		this.images = {};

		if (this.audioContext) {
			this.audioContext.close();
		}
	};

	private setupCampaign = async (campaign: Campaign) => {
		console.log("setupCampaign: ", campaign);

		this.isLoading = true;

		if (!this.canvas) {
			console.log("no canvas available");
			return;
		}
		this.canvas.width = campaign.scene.width;
		this.canvas.height = campaign.scene.height;

		this.campaign = campaign;
		const { blocks } = campaign;

		// Load images
		const imageBlocks = blocks.filter(
			({ type }) => type === BLOCK_TYPE.image,
		) as BlockImage[];
		await Promise.all(
			imageBlocks.map(({ props }) => {
				const { src } = props;
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.src = src;
				this.images[src] = img;
				return new Promise<void>((res) => {
					img.onload = () => res();
					img.onerror = () => {
						console.log(`image not loaded: ${src}`);
						res();
					};
				});
			}),
		);

		// Load videos
		const { mainVideoBlock, secondaryVideoBlocks } =
			this.getAllVideos(blocks);

		if (!mainVideoBlock) {
			return;
		}

		// Setup main video
		this.mainVideo.src = mainVideoBlock.props.src;
		await this.mainVideo.play(); // start immediately

		// Create audio context for mixing
		this.audioContext = new AudioContext();
		this.audioDestination =
			this.audioContext.createMediaStreamDestination();

		if (!this.audioDestination) {
			console.log("no audioDestination");
			return;
		}

		// Setup main video audio
		this.mainVideo.muted = false; // Keep unmuted for mixing
		const mainSource = this.audioContext.createMediaStreamSource(
			// TODO
			(this.mainVideo as any).captureStream(),
		);

		// Add main video volume control
		const mainGain = this.audioContext.createGain();
		mainGain.gain.value = 1.0; // Full volume
		mainSource.connect(mainGain).connect(this.audioDestination);

		// Setup secondary videos with individual volume control
		await Promise.all(
			secondaryVideoBlocks.map(async (videoBlock) => {
				const { src, startOffset = 0, volume = 1.0 } = videoBlock.props;

				if (!this.secondaryVideos[src]) {
					const video = document.createElement("video");
					video.crossOrigin = "anonymous";
					video.muted = false; // UNMUTE for audio mixing
					video.playsInline = true;
					video.src = src;
					this.secondaryVideos[src] = video;

					return new Promise<void>((resolve, reject) => {
						video.onloadeddata = () => {
							// Create audio source and gain for this video
							const source =
								this.audioContext?.createMediaStreamSource(
									(video as any).captureStream(),
								);
							if (!source) {
								console.log("no source");
								return;
							}
							const gain = this.audioContext?.createGain();
							if (!gain) {
								console.log("gaion not created");
								return;
							}
							gain.gain.value = volume;
							// TODO
							source
								.connect(gain)
								.connect(this.audioDestination as AudioNode);

							video.currentTime = Math.max(
								0,
								(this.mainVideo.currentTime * 1000 -
									startOffset) /
									1000,
							);
							video.play().then(resolve).catch(reject);
						};
						video.onerror = () => {
							console.error(`Failed to load video: ${src}`);
							reject();
						};
					});
				}
			}),
		);

		// Use mixed audio instead of just main video
		const canvasStream = this.canvas.captureStream();
		const mixedAudioTrack =
			this.audioDestination.stream.getAudioTracks()[0];
		canvasStream.addTrack(mixedAudioTrack);

		// font loading
		const fonts: FontFace[] = [];
		await Promise.all(
			blocks
				.filter(({ type }) => type === BLOCK_TYPE.text)
				.filter((block) => !!(block as BlockText).props.fontUrl)
				.filter(
					(block) =>
						!this.fontNames.hasOwnProperty(
							(block as BlockText).props.fontUrl as string,
						),
				)
				.map((block, i) => {
					const fontUrl = (block as BlockText).props
						.fontUrl as string;
					const fontFamilyName = `CustomFont-${i}`;
					const font = new FontFace(fontFamilyName, fontUrl);
					fonts.push(font);
					this.fontNames[fontUrl] = fontFamilyName;
					return font.load();
				}),
		);
		fonts.forEach((font) => document.fonts.add(font));

		const options = {
			// mimeType: "video/mp4",
			mimeType: "video/webm; codecs=vp9",
			// mimeType: "video/mp4; codecs=avc1.424028, mp4a.40.2",
		};

		this.recordedChunks = [];
		this.mediaRecorder = new MediaRecorder(canvasStream, options);

		this.mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) {
				this.recordedChunks.push(e.data);
			}
		};
		this.mediaRecorder.onstop = () => this.download();
		this.mediaRecorder.start();

		this.isLoading = false;
		if (this.raf == null) {
			this.raf = this.mainVideo.requestVideoFrameCallback(this.render);
		}
	};

	private getAllVideos = (
		blocks: Block[],
	): {
		mainVideoBlock: BlockVideo | undefined;
		secondaryVideoBlocks: BlockVideo[];
	} => {
		const allVideos = blocks.filter(
			(block) => block.type === BLOCK_TYPE.video,
		);

		if (allVideos.length === 0) {
			console.log("no video was found");
			return { mainVideoBlock: undefined, secondaryVideoBlocks: [] };
		}
		if (allVideos.length === 1) {
			return {
				mainVideoBlock: allVideos[0] as BlockVideo,
				secondaryVideoBlocks: [],
			};
		}
		const mainVideoBlock = allVideos.find(
			(videoBlock) => (videoBlock as BlockVideo).props.isMainVideo,
		);
		if (!mainVideoBlock) {
			console.log("no main video was found");
			return { mainVideoBlock: undefined, secondaryVideoBlocks: [] };
		}
		const secondaryVideoBlocks = allVideos.filter(
			(videoBlock) => !(videoBlock as BlockVideo).props.isMainVideo,
		) as BlockVideo[];
		return {
			mainVideoBlock: mainVideoBlock as BlockVideo,
			secondaryVideoBlocks,
		};
	};

	private setupAnimations = (campaign: Campaign) => {
		const { blocks } = campaign;

		blocks.forEach(({ props }) => {
			if (!props.animations) {
				return;
			}
			const allAnimations: Animation[] = [];
			props.animations.forEach((animation) => {
				allAnimations.push({ ...animation, count: 1 });
				if (animation.count) {
					const { startTime, duration, repeatDelay = 0 } = animation;
					for (let i = 0; i < animation.count - 1; i++) {
						const newAnimation = { ...animation, count: 1 };
						newAnimation.startTime =
							startTime + (repeatDelay + duration) * (i + 1);
						allAnimations.push(newAnimation);
						if (
							newAnimation.startTime >
							this.mainVideo.duration * 1000
						) {
							break;
						}
					}
				}
			});
			allAnimations.sort((a1, a2) => a1.startTime - a2.startTime);
			props.animations = allAnimations;
		});
	};

	private download = () => {
		const blob = new Blob([...this.recordedChunks], { type: "video/webm" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "POC_CanvasToVideo.webm";
		a.click();
		URL.revokeObjectURL(url);
	};

	private getValue = (
		props: PropsBase | PropsVideo | PropsAudio,
		property: PROPERTY,
	): number => {
		const defaultValue = props.hasOwnProperty(property)
			? ((props as any)[property] as number)
			: defaultPropertyValues[property];

		const { animations = [] } = props;
		if (animations.length === 0) {
			return defaultValue;
		}

		const propertyAnimations = animations.filter(
			(animation) => animation.property === property,
		);
		if (propertyAnimations.length === 0) {
			return defaultValue;
		}

		// Find an animation that should be currently used
		const animation = propertyAnimations.find(({ startTime, duration }) => {
			return (
				this.currTime >= startTime &&
				this.currTime <= startTime + duration
			);
		});

		// Find the last animation that has been used
		const lastAnimation = propertyAnimations
			.filter(
				({ startTime, duration }) =>
					startTime + duration < this.currTime,
			)
			.sort(
				(a, b) => b.startTime + b.duration - (a.startTime + a.duration),
			)[0];
		if (!animation) {
			if (!lastAnimation) {
				return defaultValue;
			} else {
				return lastAnimation.endValue;
			}
		}

		const { startTime, duration, endValue } = animation;

		let actualStartValue = defaultValue;
		if (animation.hasOwnProperty("startValue")) {
			// use startValue if any
			actualStartValue = animation.startValue as number;
		} else if (lastAnimation) {
			// use lastAnimation's endValue if any
			actualStartValue = lastAnimation.endValue as number;
		}

		const easing = getEasingFunction(animation.easing);
		const time = easing(
			map(this.currTime, startTime, startTime + duration, 0, 1),
		);

		return map(time, 0, 1, actualStartValue, endValue);
	};

	// TODO: this should not be needed
	private getVideoElement = (block: BlockVideo): HTMLVideoElement | null => {
		const { src, isMainVideo } = block.props;

		if (isMainVideo) {
			return this.mainVideo;
		}

		return this.secondaryVideos[src] || null;
	};

	private syncSecondaryVideos = () => {
		if (!this.campaign) {
			console.log("no campaign");
			return;
		}
		const { blocks } = this.campaign;
		const { secondaryVideoBlocks } = this.getAllVideos(blocks);

		secondaryVideoBlocks.forEach((videoBlock) => {
			const { src, startOffset = 0 } = videoBlock.props;
			const video = this.secondaryVideos[src];

			if (video && video.readyState >= 2) {
				const targetTime = Math.max(
					0,
					(this.currTime - startOffset) / 1000,
				);
				const timeDiff = Math.abs(video.currentTime - targetTime);

				// Resync if difference is more than 100ms
				if (timeDiff > 0.1) {
					video.currentTime = targetTime;
				}
			}
		});
	};

	private render = (_: number, metadata: VideoFrameCallbackMetadata) => {
		if (this.mainVideo.readyState < 2) {
			this.raf = this.mainVideo.requestVideoFrameCallback(this.render);
			return;
		}

		if (!this.ctx) {
			console.log("no ctx");
			return;
		}

		if (!this.canvas) {
			console.log("no canvas");
			return;
		}

		if (!this.campaign) {
			console.log("no campaign");
			return;
		}

		// clean the canvas
		this.ctx.fillStyle = "#000000";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.currTime = metadata.mediaTime * 1000;

		// Sync secondary videos
		this.syncSecondaryVideos();

		this.campaign.blocks
			.sort(
				({ props: props1 }, { props: props2 }) =>
					props1.zIndex - props2.zIndex,
			)
			.forEach((block) => {
				const { type, props } = block;

				const alpha = this.getValue(props, PROPERTY.opacity);
				let x = this.getValue(props, PROPERTY.x);
				let y = this.getValue(props, PROPERTY.y);
				let scale = this.getValue(props, PROPERTY.scale);

				if (!this.ctx) {
					console.log("no ctx2");
					return;
				}
				this.ctx.globalAlpha = alpha;
				switch (type) {
					case BLOCK_TYPE.video:
					case BLOCK_TYPE.image:
						const {
							width: w,
							height: h,
							src,
							regX = 0,
							regY = 0,
						} = props;
						x -= w * scale * regX;
						y -= h * scale * regY;

						this.ctx.drawImage(
							type === BLOCK_TYPE.video
								? (this.getVideoElement(
										block,
									) as HTMLVideoElement)
								: this.images[src],
							x,
							y,
							w * scale,
							h * scale,
						);

						// if rotations are needed
						// this.ctx.setTransform(scale, 0, 0, scale, x, y);
						// this.ctx.rotate(this.currTime * 0.001);
						// this.ctx.drawImage(
						// 	type === ASSET_TYPE.video
						// 		? this.video
						// 		: this.images[src],
						// 	-regX * w,
						// 	-regY * h,
						// 	w,
						// 	h
						// );
						// this.ctx.setTransform(1, 0, 0, 1, 0, 0);
						break;
					case BLOCK_TYPE.text:
						const { text, fontSize, fontUrl = "" } = block.props;
						this.ctx.font = `${fontSize}px ${this.fontNames[fontUrl]}`;
						this.ctx.fillStyle = "rgba(255,255,255,1)";

						const { width: textWidth } = this.ctx.measureText(text);
						this.ctx.fillText(
							text,
							x - textWidth / 2,
							y + fontSize / 2,
						);
						break;
					case BLOCK_TYPE.rectangle:
						const {
							fill,
							stroke,
							width: w1,
							height: h1,
							regX: regX1 = 0,
							regY: regY1 = 0,
							lineWidth = 1,
						} = block.props;

						x -= w1 * scale * regX1;
						y -= h1 * scale * regY1;

						if (fill) {
							this.ctx.fillStyle = fill;
							this.ctx.fillRect(x, y, w1 * scale, h1 * scale);
						}
						if (stroke) {
							this.ctx.lineWidth = lineWidth * scale;
							this.ctx.strokeStyle = stroke;
							this.ctx.strokeRect(x, y, w1 * scale, h1 * scale);
						}
						break;
					default:
						break;
				}
				this.ctx.globalAlpha = 1;
			});

		this.raf = this.mainVideo.requestVideoFrameCallback(this.render);
	};
}
