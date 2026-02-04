// https://easings.net/#

import { EASING } from "./types.mts";

export function getEasingFunction(
	easing: EASING | undefined,
): (_: number) => number {
	switch (easing) {
		case EASING.easeIn:
			return easeInCubic;
		case EASING.easeOut:
			return easeOutCubic;
		case EASING.easeInOut:
			return easeInOutCubic;
		case EASING.elasticIn:
			return easeInElastic;
		case EASING.elasticOut:
			return easeOutElastic;
		case EASING.elasticInOut:
			return easeInOutElastic;
		case EASING.bounceIn:
			return easeInBounce;
		case EASING.bounceOut:
			return easeOutBounce;
		case EASING.bounceInOut:
			return easeInOutBounce;
		case EASING.linear:
		default:
			return linear;
	}
}

export function linear(x: number): number {
	return x;
}

// CUBIC
export function easeInCubic(x: number): number {
	return x * x * x;
}

export function easeOutCubic(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// ELASTIC
export function easeInElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;
	return x === 0
		? 0
		: x === 1
			? 1
			: -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

export function easeOutElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;
	return x === 0
		? 0
		: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function easeInOutElastic(x: number): number {
	const c5 = (2 * Math.PI) / 4.5;
	return x === 0
		? 0
		: x === 1
			? 1
			: x < 0.5
				? -(
						Math.pow(2, 20 * x - 10) *
						Math.sin((20 * x - 11.125) * c5)
					) / 2
				: (Math.pow(2, -20 * x + 10) *
						Math.sin((20 * x - 11.125) * c5)) /
						2 +
					1;
}

// BOUNCE
export function easeInBounce(x: number): number {
	return 1 - easeOutBounce(1 - x);
}

export function easeOutBounce(x: number): number {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

export function easeInOutBounce(x: number): number {
	return x < 0.5
		? (1 - easeOutBounce(1 - 2 * x)) / 2
		: (1 + easeOutBounce(2 * x - 1)) / 2;
}
