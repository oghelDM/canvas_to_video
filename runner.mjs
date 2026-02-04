import puppeteer from "puppeteer";
import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PROPERTY, BLOCK_TYPE, EASING } from "./types.mjs";
import { campaignAlpine } from "./campaigns/data-Alpine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCreative(campaignConfig, recordDurationMs = 5000) {
	const browser = await puppeteer.launch({
		headless: false,
		devtools: true,
		args: [
			"--autoplay-policy=no-user-gesture-required",
			"--use-fake-ui-for-media-stream",
			"--use-fake-device-for-media-stream",
			"--disable-web-security",
			"--allow-file-access-from-files",
		],
	});

	const page = await browser.newPage();

	page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
	page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

	await page.setViewport({
		width: campaignConfig.scene.width,
		height: campaignConfig.scene.height,
	});

	console.log("Loading page...");

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
        canvas {
          display: block;
        }
      </style>
    </head>
    <body>
      <script type="module">
        import { MyCreative } from './toto.mjs';
        
        const campaign = ${JSON.stringify(campaignConfig)};
        const recordDuration = ${recordDurationMs};
        
        console.log('Starting creative...');
        
        try {
          const creative = new MyCreative(campaign, recordDuration);
          window.creative = creative;
          
          creative.setupCampaign(campaign)
            .then(() => console.log('Campaign started!'))
            .catch(err => console.error('Setup failed:', err));
        } catch (err) {
          console.error('Failed:', err);
        }
      </script>
    </body>
    </html>
  `;

	const htmlPath = join(__dirname, "temp.html");
	writeFileSync(htmlPath, html);

	await page.goto(`file://${htmlPath}`, {
		waitUntil: "domcontentloaded",
	});

	console.log("Page loaded!");

	const waitTime = recordDurationMs + 3000;
	console.log(`Waiting ${waitTime}ms for recording...`);
	await new Promise((resolve) => setTimeout(resolve, waitTime));

	console.log("Extracting video data...");

	const videoData = await page.evaluate(() => {
		console.log("__videoReady:", window.__videoReady);
		console.log("__videoBuffer size:", window.__videoBuffer?.length);
		if (window.__videoBuffer) {
			return Array.from(window.__videoBuffer);
		}
		return null;
	});

	console.log(
		"Got video data:",
		videoData ? `${videoData.length} bytes` : "null",
	);

	if (videoData) {
		const buffer = Buffer.from(videoData);
		const outputPath = join(__dirname, "output.webm");
		writeFileSync(outputPath, buffer);
		console.log(`✅ Video saved to: ${outputPath}`);
		console.log(`   Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
	} else {
		console.error("❌ No video data found!");
	}

	console.log("\nClosing browser in 3 seconds...");
	await new Promise((resolve) => setTimeout(resolve, 3000));
	await browser.close();
	console.log("Done!");
}

runCreative(campaignAlpine, 50000).catch(console.error);
