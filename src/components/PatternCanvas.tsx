import React, { use, useEffect, useRef, useState } from 'react';

export default function PatternCanvas({ imageData, fgColor, bgColor, redrawTrigger }: any) {
	const sketchRef = useRef<HTMLDivElement>(null);
	const [mask, setMask] = useState(null); // State to hold the mask
	const [currMask, setCurrMask] = useState(0); // State to hold the mask counter
	const [nextMask, setNextMask] = useState(0); // State to hold the next mask counter

	function drawRandomRectangles(p: any, mask: any, width: number, height: number) {
		mask.fill(255); // Use white color for the mask
		mask.noStroke();
		let numberOfRectangles = 20; // Example: 20 random rectangles
		for (let i = 0; i < numberOfRectangles; i++) {
			// Generate random x, y coordinates rounded to nearest multiple of 10
			let x = Math.floor(p.random(width) / 10) * 10;
			let y = Math.floor(p.random(height) / 10) * 10;
			// Generate random width and height, ensuring they are multiples of 10
			let rectWidth = Math.floor(p.random(20, width / 2) / 10) * 10;
			let rectHeight = Math.floor(p.random(20, height / 2) / 10) * 10;

			// Ensure that the rectangle stays within the canvas boundaries
			rectWidth = Math.min(rectWidth, width - x); // Adjust width if it exceeds canvas width
			rectHeight = Math.min(rectHeight, height - y); // Adjust height if it exceeds canvas height

			mask.rect(x, y, rectWidth, rectHeight);
		}
	}

	useEffect(() => {
		setNextMask(() => nextMask + 1);
	}, [redrawTrigger]);

	useEffect(() => {
		const p5 = require('p5');

		if (typeof window !== 'undefined') {
			const sketch = (p: any) => {
				let img: any;

				let pixelatedGraphicsLow: any;
				let pixelatedGraphicsHigh: any;
				let compositeGraphics: any;

				let canvasWidth: number;
				let canvasHeight: number;

				p.preload = () => {
					if (imageData) {
						img = p.loadImage(imageData);
					}
				};

				p.setup = () => {
					p.pixelDensity(1);

					if (sketchRef.current) {
						canvasWidth = sketchRef.current.clientWidth;
						canvasHeight = sketchRef.current.clientHeight;

						p.createCanvas(canvasWidth, canvasHeight);

						pixelatedGraphicsLow = p.createGraphics(canvasWidth, canvasHeight);
						pixelatedGraphicsHigh = p.createGraphics(canvasWidth, canvasHeight);
						compositeGraphics = p.createGraphics(canvasWidth, canvasHeight);
					}

					pixelatedGraphicsLow.noSmooth(); // Disable smoothing to keep the pixelated effect
					pixelatedGraphicsHigh.noSmooth();
					compositeGraphics.noSmooth();
					p.noLoop();

					initializeMask(); // Initialize the mask on setup
				};

				function initializeMask() {
					if (mask && nextMask == 1) {
						return; // Skip if mask is already initialized
					}
					if (currMask < nextMask) {
						let newMask = p.createGraphics(canvasWidth, canvasHeight);
						drawRandomRectangles(p, newMask, canvasWidth, canvasHeight);
						setMask(newMask); // Save the mask to state
						setCurrMask(() => currMask + 1);
					}
				}

				function pixelate(img: any, pixelSize: number, pxGraphics: any) {
					// Resize the image to a very low resolution
					const numCols = Math.ceil(canvasWidth / pixelSize);
					const numRows = Math.ceil(canvasHeight / pixelSize);
					img.resize(numCols, numRows);

					pxGraphics.clear(); // Clear previous drawings
					// Draw the pixelated image using the fg and bg colors
					img.loadPixels();
					pxGraphics.loadPixels();
					for (let i = 0; i < img.width; i++) {
						for (let j = 0; j < img.height; j++) {
							const pixelIndex = (i + j * img.width) * 4;
							const r = img.pixels[pixelIndex];
							const g = img.pixels[pixelIndex + 1];
							const b = img.pixels[pixelIndex + 2];

							// Determine the brightness of the pixel
							const brightness = (r + g + b) / 3;
							pxGraphics.fill(brightness > 128 ? fgColor : bgColor);
							pxGraphics.noStroke();
							pxGraphics.rect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
						}
					}
				}

				function compositeImages(maskGraphics: any, pixelatedGraphicsHigh: any, compositeGraphics: any) {
					maskGraphics.loadPixels();
					pixelatedGraphicsHigh.loadPixels();
					compositeGraphics.loadPixels();

					for (let y = 0; y < canvasHeight; y++) {
						for (let x = 0; x < canvasWidth; x++) {
							const index = (x + y * canvasWidth) * 4;
							// Assuming mask is not using a black color to mask
							if (maskGraphics.pixels[index] > 0) {
								// Apply pixel data from high to composite
								compositeGraphics.pixels[index] = pixelatedGraphicsHigh.pixels[index]; // R
								compositeGraphics.pixels[index + 1] = pixelatedGraphicsHigh.pixels[index + 1]; // G
								compositeGraphics.pixels[index + 2] = pixelatedGraphicsHigh.pixels[index + 2]; // B
								compositeGraphics.pixels[index + 3] = 255; // Fully opaque
							} else {
								// Set transparent or background color
								compositeGraphics.pixels[index + 3] = 0; // Make transparent
							}
						}
					}

					compositeGraphics.updatePixels();
				}

				p.draw = () => {
					p.background(bgColor);

					//console.log('compositeGraphics', compositeGraphics.width, compositeGraphics.height);

					if (img) {
						let imgCopy = img.get();
						pixelate(img, 40, pixelatedGraphicsLow);
						pixelate(imgCopy, 10, pixelatedGraphicsHigh);

						// Draw the pixelated low-resolution image
						p.image(pixelatedGraphicsLow, 0, 0);

						// Create mask and composite graphics
						if (mask) {
							compositeImages(mask, pixelatedGraphicsHigh, compositeGraphics);
							p.image(compositeGraphics, 0, 0);
							//p.image(mask, 0, 0);
						}
					}
				};

				p.myCustomRedrawAccordingToNewProps = (props: any) => {
					if (props.imageData && props.imageData !== img) {
						img = p.loadImage(props.imageData, () => {
							p.redraw(); // Ensure the canvas is redrawn once the image is loaded
						});
					} else {
						//p.redraw(); // Redraw when the redrawTrigger changes
					}
				};
			};

			const myP5 = new p5(sketch, sketchRef.current);
			myP5.myCustomRedrawAccordingToNewProps({ imageData, fgColor, bgColor }); // Pass all props

			return () => {
				myP5.remove(); // Proper cleanup to remove the p5 instance when the component unmounts
			};
		}
	}, [imageData, bgColor, fgColor, mask, nextMask]); // Depend on imageData to ensure updates trigger this effect

	return (
		<>
			<div ref={sketchRef} style={{ width: '600px', height: '600px' }} className="bg-transparent" />;
			<div className="bg-white absolute bottom-0">
				{currMask}, {nextMask}
			</div>
		</>
	);
}
