import React, { use, useEffect, useRef, useState } from 'react';
import { type Sketch, type SketchProps } from '@p5-wrapper/react';
import { NextReactP5Wrapper } from '@p5-wrapper/next';

export default function PatternCanvas({ imageData, fgColor, bgColor, redrawTrigger }: any) {
	const sketchRef = useRef<HTMLDivElement>(null);
	const [mask, setMask] = useState(null);
	const [triggerCount, setTriggerCount] = useState(0); // To track redrawTrigger clicks
	const [maskCount, setMaskCount] = useState(0);

	type MySketchProps = SketchProps & {
		imageData: any;
	};

	useEffect(() => {
		setTriggerCount((count) => count + 1); // Increment on redrawTrigger change
	}, [redrawTrigger]);

	const sketch: Sketch = (p5) => {
		let img: any;
		let maskGraphics: any;
		//let maskCount = 1;

		let pixelatedGraphicsLow: any;
		let pixelatedGraphicsHigh: any;
		let compositeGraphics: any;

		let canvasWidth: number;
		let canvasHeight: number;

		p5.updateWithProps = (props: any) => {
			if (props.imageData) {
				img = p5.loadImage(props.imageData);
			}
		};

		p5.preload = () => {
			if (imageData) {
				img = p5.loadImage(imageData);
			}
		};

		p5.setup = () => {
			p5.pixelDensity(1);

			canvasWidth = 600;
			canvasHeight = 600;

			p5.createCanvas(canvasWidth, canvasHeight);

			pixelatedGraphicsLow = p5.createGraphics(canvasWidth, canvasHeight);
			pixelatedGraphicsHigh = p5.createGraphics(canvasWidth, canvasHeight);
			maskGraphics = p5.createGraphics(canvasWidth, canvasHeight);
			compositeGraphics = p5.createGraphics(canvasWidth, canvasHeight);

			pixelatedGraphicsLow.noSmooth(); // Disable smoothing to keep the pixelated effect
			pixelatedGraphicsHigh.noSmooth();
			compositeGraphics.noSmooth();
			p5.noLoop();
		};

		function drawMask() {
			maskGraphics.clear(); // Clear previous drawings
			drawRandomRectangles(p5, maskGraphics, canvasWidth, canvasHeight);
			//setMask(() => maskGraphics);
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

		function drawRandomRectangles(p5: any, mask: any, width: number, height: number) {
			mask.fill(255); // Use white color for the mask
			mask.noStroke();
			let numberOfRectangles = 20; // Example: 20 random rectangles
			for (let i = 0; i < numberOfRectangles; i++) {
				// Generate random x, y coordinates rounded to nearest multiple of 10
				let x = Math.floor(p5.random(width) / 10) * 10;
				let y = Math.floor(p5.random(height) / 10) * 10;
				// Generate random width and height, ensuring they are multiples of 10
				let rectWidth = Math.floor(p5.random(20, width / 2) / 10) * 10;
				let rectHeight = Math.floor(p5.random(20, height / 2) / 10) * 10;

				// Ensure that the rectangle stays within the canvas boundaries
				rectWidth = Math.min(rectWidth, width - x); // Adjust width if it exceeds canvas width
				rectHeight = Math.min(rectHeight, height - y); // Adjust height if it exceeds canvas height

				mask.rect(x, y, rectWidth, rectHeight);
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

		p5.draw = () => {
			p5.background(bgColor);

			if (img) {
				let imgCopy = img.get();
				pixelate(img, 40, pixelatedGraphicsLow);
				pixelate(imgCopy, 10, pixelatedGraphicsHigh);

				// Draw the pixelated low-resolution image
				p5.image(pixelatedGraphicsLow, 0, 0);

				// Create mask and composite graphics
				if (maskGraphics) {
					// Update only if there's a trigger change
					if (maskCount < triggerCount) {
						drawMask();
						setMaskCount(triggerCount);
					}
					compositeImages(maskGraphics, pixelatedGraphicsHigh, compositeGraphics);
					p5.image(compositeGraphics, 0, 0);
				}
			}
		};
		console.log({ maskCount });
		console.log({ triggerCount });
	};

	return (
		<>
			{/* <div ref={sketchRef} style={{ width: '600px', height: '600px' }} className="bg-transparent" />; */}
			<div className="bg-white absolute bottom-0 px-2">{triggerCount}</div>
			{/* <button onClick={handleExport}>Export PNG</button> */}
			<NextReactP5Wrapper sketch={sketch} bgColor={bgColor} fgColor={fgColor} imageData={imageData} mask={mask} />;
		</>
	);
}
