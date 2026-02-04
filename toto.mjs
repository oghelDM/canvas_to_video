import { PROPERTY, BLOCK_TYPE, defaultPropertyValues } from "./types.mjs";
import { getEasingFunction } from "./easing.mjs";
import { map } from "./helper.mjs";

export class MyCreative {
	canvas;
	ctx;
	raf;
	mainVideo;
	// TODO: add this to the existing VideoBlock or smth
	secondaryVideos = {};

	mediaRecorder;
	// store the images' HTMLImageElement (no duplicate)
	// TODO: add this to the existing ImageBlock or smth
	images = {};
	currTime = 0;
	campaign;
	recordedChunks = [];
	// store the fonts' family names
	fontNames = {};
	isLoading = false;
	// audio management
	audioContext;
	audioDestination; // where each audio track is added
	recordDuration;

	constructor(_campaign, recordDuration = 5000) {
		this.campaign = _campaign;
		this.recordDuration = recordDuration;

		this.mainVideo = document.createElement("video");
		this.mainVideo.crossOrigin = "anonymous";
		this.mainVideo.muted = true;
		this.mainVideo.playsInline = true;

		// debugging
		document.body.appendChild(this.mainVideo);

		this.setupCanvas();
	}

	setupCanvas = () => {
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);

		const ctx = this.canvas.getContext("2d");
		if (!ctx) {
			alert("no canvas context found :(");
			return;
		}
		this.ctx = ctx;
	};

	cleanup = () => {
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

	setupCampaign = async (campaign) => {
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
		);
		await Promise.all(
			imageBlocks.map(({ props }) => {
				const { src } = props;
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.src = src;
				this.images[src] = img;
				return new Promise((res) => {
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
			this.mainVideo.captureStream(),
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

					return new Promise((resolve, reject) => {
						video.onloadeddata = () => {
							// Create audio source and gain for this video
							const source =
								this.audioContext?.createMediaStreamSource(
									video.captureStream(),
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
							source.connect(gain).connect(this.audioDestination);

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
		const canvasStream = this.canvas.captureStream(30); // 30 FPS
		console.log("Canvas stream created at 30 FPS");
		const mixedAudioTrack =
			this.audioDestination.stream.getAudioTracks()[0];
		canvasStream.addTrack(mixedAudioTrack);

		// font loading
		const fonts = [];
		await Promise.all(
			blocks
				.filter(({ type }) => type === BLOCK_TYPE.text)
				.filter((block) => !!block.props.fontUrl)
				.filter(
					(block) =>
						!this.fontNames.hasOwnProperty(block.props.fontUrl),
				)
				.map((block, i) => {
					const fontUrl = block.props.fontUrl;
					const fontFamilyName = `CustomFont-${i}`;
					const font = new FontFace(fontFamilyName, fontUrl);
					fonts.push(font);
					this.fontNames[fontUrl] = fontFamilyName;
					return font.load();
				}),
		);
		fonts.forEach((font) => document.fonts.add(font));

		// In setupCampaign, replace the MediaRecorder section with:

		console.log("Setting up MediaRecorder...");
		console.log("Canvas stream tracks:", canvasStream.getTracks());
		console.log("Audio tracks:", canvasStream.getAudioTracks().length);
		console.log("Video tracks:", canvasStream.getVideoTracks().length);

		const options = {
			mimeType: "video/webm; codecs=vp9",
		};

		// Check if codec is supported
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.warn("vp9 not supported, trying vp8...");
			options.mimeType = "video/webm; codecs=vp8";
		}
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.warn("vp8 not supported, using default...");
			options.mimeType = "video/webm";
		}

		console.log("Using mimeType:", options.mimeType);

		this.recordedChunks = [];
		this.mediaRecorder = new MediaRecorder(canvasStream, options);

		this.mediaRecorder.onstart = () => {
			console.log("✅ MediaRecorder STARTED");
		};

		this.mediaRecorder.ondataavailable = (e) => {
			console.log("📦 Data chunk received:", e.data.size, "bytes");
			if (e.data.size > 0) {
				this.recordedChunks.push(e.data);
			}
		};

		this.mediaRecorder.onstop = () => {
			console.log("⏹️  MediaRecorder STOPPED");
			console.log("Total chunks:", this.recordedChunks.length);
			this.download();
		};

		this.mediaRecorder.onerror = (e) => {
			console.error("❌ MediaRecorder ERROR:", e);
		};

		console.log("Starting MediaRecorder...");
		this.mediaRecorder.start(100); // Capture data every 100ms

		console.log("MediaRecorder state:", this.mediaRecorder.state);
		console.log("Setting timeout for", this.recordDuration, "ms");

		this.recordingTimeout = window.setTimeout(() => {
			console.log("⏰ TIMEOUT FIRED!");
			console.log("MediaRecorder state:", this.mediaRecorder?.state);
			if (
				this.mediaRecorder &&
				this.mediaRecorder.state === "recording"
			) {
				console.log("Stopping recorder...");
				this.mediaRecorder.stop();
			} else {
				console.log(
					"Recorder is not recording! State:",
					this.mediaRecorder?.state,
				);
			}
		}, this.recordDuration || 5000);

		console.log("Timeout set, will fire in", this.recordDuration, "ms");

		this.isLoading = false;
		if (this.raf == null) {
			this.raf = this.mainVideo.requestVideoFrameCallback(this.render);
		}
	};

	getAllVideos = (blocks) => {
		const allVideos = blocks.filter(
			(block) => block.type === BLOCK_TYPE.video,
		);

		if (allVideos.length === 0) {
			console.log("no video was found");
			return { mainVideoBlock: undefined, secondaryVideoBlocks: [] };
		}
		if (allVideos.length === 1) {
			return {
				mainVideoBlock: allVideos[0],
				secondaryVideoBlocks: [],
			};
		}
		const mainVideoBlock = allVideos.find(
			(videoBlock) => videoBlock.props.isMainVideo,
		);
		if (!mainVideoBlock) {
			console.log("no main video was found");
			return { mainVideoBlock: undefined, secondaryVideoBlocks: [] };
		}
		const secondaryVideoBlocks = allVideos.filter(
			(videoBlock) => !videoBlock.props.isMainVideo,
		);
		return {
			mainVideoBlock: mainVideoBlock,
			secondaryVideoBlocks,
		};
	};

	setupAnimations = (campaign) => {
		const { blocks } = campaign;

		blocks.forEach(({ props }) => {
			if (!props.animations) {
				return;
			}
			const allAnimations = [];
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

	download = async () => {
		console.log("Download called!");
		console.log("Recorded chunks:", this.recordedChunks.length);

		if (this.recordedChunks.length === 0) {
			console.error("❌ No chunks recorded!");
			return;
		}

		const blob = new Blob([...this.recordedChunks], { type: "video/webm" });
		console.log("Blob size:", blob.size, "bytes");

		const buffer = await blob.arrayBuffer();

		window.__videoBuffer = new Uint8Array(buffer);
		window.__videoReady = true;

		console.log(
			"✅ Video ready for download, size:",
			buffer.byteLength,
			"bytes",
		);
	};

	getValue = (props, property) => {
		const defaultValue = props.hasOwnProperty(property)
			? props[property]
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
			actualStartValue = animation.startValue;
		} else if (lastAnimation) {
			// use lastAnimation's endValue if any
			actualStartValue = lastAnimation.endValue;
		}

		const easing = getEasingFunction(animation.easing);
		const time = easing(
			map(this.currTime, startTime, startTime + duration, 0, 1),
		);

		return map(time, 0, 1, actualStartValue, endValue);
	};

	// TODO: this should not be needed
	getVideoElement = (block) => {
		const { src, isMainVideo } = block.props;

		if (isMainVideo) {
			return this.mainVideo;
		}

		return this.secondaryVideos[src] || null;
	};

	syncSecondaryVideos = () => {
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

	render = (_, metadata) => {
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
								? this.getVideoElement(block)
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
