export const map = (
	value: number,
	start1: number,
	stop1: number,
	start2: number,
	stop2: number,
): number => start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));

export const keepSafe = (idx: number, nb: number): number =>
	((idx % nb) + nb) % nb;

export const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);

export const random12 = (v1: number, v2: number): number =>
	map(Math.random(), 0, 1, v1, v2);

export const getClientXY = (
	evt: PointerEvent | MouseEvent,
	rect = { left: 0, top: 0 },
) => {
	const x = evt.clientX - rect.left;
	const y = evt.clientY - rect.top;
	return { x, y };
};

// returns the offsets and dimensions of an image that is to fit inside a parent, whether in 'cover' or 'contain' mode
const fit =
	(contains: boolean) =>
	(
		parentWidth: number,
		parentHeight: number,
		childWidth: number,
		childHeight: number,
		scale = 1,
		offsetX = 0.5,
		offsetY = 0.5,
	) => {
		const childRatio: number = childWidth / childHeight;
		const parentRatio: number = parentWidth / parentHeight;
		let width: number = parentWidth * scale;
		let height: number = parentHeight * scale;

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

export const shuffle = (array: any[]) => {
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
