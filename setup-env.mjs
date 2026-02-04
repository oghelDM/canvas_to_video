import { JSDOM } from "jsdom";
import { Canvas, Image } from "canvas";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	pretendToBeVisual: true,
});

global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLVideoElement = dom.window.HTMLVideoElement;
global.Image = Image;

document.createElement = function (tagName) {
	if (tagName === "canvas") {
		return new Canvas(300, 150);
	}
	return dom.window.document.createElement(tagName);
};
