export const map = (value, start1, stop1, start2, stop2) =>
	start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));

export const keepSafe = (idx, nb) => ((idx % nb) + nb) % nb;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const random12 = (v1, v2) => map(Math.random(), 0, 1, v1, v2);

export const getClientXY = (evt, rect = { left: 0, top: 0 }) => {
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	return { x, y };
};

// returns the offsets and dimensions of an image that is to fit inside a parent, whether in 'cover' or 'contain' mode
const fit =
	(contains) =>
	(
		parentWidth,
		parentHeight,
		childWidth,
		childHeight,
		scale = 1,
		offsetX = 0.5,
		offsetY = 0.5,
	) => {
		const childRatio = childWidth / childHeight;
		const parentRatio = parentWidth / parentHeight;
		let width = parentWidth * scale;
		let height = parentHeight * scale;

		if (contains ? childRatio > parentRatio : childRatio < parentRatio) {
			height = width / childRatio;
		} else {
			width = height * childRatio;
		}

		return {
			width,
			height,
			offsetX: (parentWidth - width) * offsetX,
			offsetY: (parentHeight - height) * offsetY,
		};
	};

export const shuffle = (array) => {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}
};

export const contain = fit(true);
export const cover = fit(false);
