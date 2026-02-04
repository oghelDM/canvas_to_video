import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCreative(campaignConfig) {
	// Launch browser with necessary flags for video/audio
	const browser = await puppeteer.launch({
		headless: true, // Set to false to see what's happening
		args: [
			"--autoplay-policy=no-user-gesture-required",
			"--use-fake-ui-for-media-stream",
			"--use-fake-device-for-media-stream",
			"--disable-web-security", // For CORS if needed
			"--allow-file-access-from-files",
		],
	});

	const page = await browser.newPage();

	// Set viewport to match your campaign dimensions
	await page.setViewport({
		width: campaignConfig.scene.width,
		height: campaignConfig.scene.height,
	});

	console.log("Loading page...");

	// Create an HTML page that loads your code
	const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden;
          background: #000;
        }
        #container {
          width: ${campaignConfig.scene.width}px;
          height: ${campaignConfig.scene.height}px;
        }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script type="module">
        // Your campaign configuration
        const campaign = ${JSON.stringify(campaignConfig)};
        
        // Import your creative code
        import { MyCreative } from './toto.mjs';
        
        // Initialize
        const creative = new MyCreative(campaign);
        
        // Expose for debugging
        window.creative = creative;
      </script>
    </body>
    </html>
  `;

	// Save HTML temporarily
	const htmlPath = join(__dirname, "temp.html");
	writeFileSync(htmlPath, html);

	// Navigate to the page
	await page.goto(`file://${htmlPath}`, {
		waitUntil: "networkidle0",
	});

	console.log("Page loaded, processing video...");

	// Wait for video to complete (adjust timeout as needed)
	await page.waitForFunction(
		() => {
			const video = document.querySelector("video");
			return video && video.ended;
		},
		{ timeout: 120000 }, // 2 minutes timeout
	);

	console.log("Video processing complete!");

	// The download should happen automatically via your code
	// Or you can capture the blob and save it here:

	await page.evaluate(() => {
		return new Promise((resolve) => {
			// Wait a bit for download to trigger
			setTimeout(resolve, 2000);
		});
	});

	await browser.close();
	console.log("Done!");
}

// Example campaign configuration
const campaign = {
	scene: {
		width: 1920,
		height: 1080,
	},
	blocks: [
		{
			type: "video",
			props: {
				src: "https://example.com/video.mp4",
				isMainVideo: true,
				width: 1920,
				height: 1080,
				x: 0,
				y: 0,
				zIndex: 0,
				opacity: 1,
				scale: 1,
			},
		},
		{
			type: "text",
			props: {
				text: "Hello World",
				fontSize: 72,
				x: 960,
				y: 540,
				zIndex: 1,
				opacity: 1,
				scale: 1,
				animations: [
					{
						property: "opacity",
						startTime: 0,
						duration: 1000,
						startValue: 0,
						endValue: 1,
						easing: "easeInOut",
					},
				],
			},
		},
	],
};

// Run it
runCreative(campaign).catch(console.error);
