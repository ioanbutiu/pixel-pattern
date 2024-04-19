import React, { useEffect, useRef } from 'react';

const CheckerboardCanvas = () => {
	const checkerboardRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const p5 = require('p5');

		if (typeof window !== 'undefined') {
			// Ensure this runs in a client-side environment
			const Sketch = (p: any) => {
				const gridSize = 8; // Size of each square in the grid

				p.setup = () => {
					// Ensure the canvas is created in an element that's mounted on the DOM
					if (checkerboardRef.current) {
						p.createCanvas(checkerboardRef.current.clientWidth, checkerboardRef.current.clientHeight);
					}
					p.noLoop(); // No need to continuously loop since the pattern is static
				};

				p.draw = () => {
					drawCheckerboard(p);
				};

				p.windowResized = () => {
					if (checkerboardRef.current) {
						p.resizeCanvas(checkerboardRef.current.clientWidth, checkerboardRef.current.clientHeight);
					}
					drawCheckerboard(p);
				};

				function drawCheckerboard(p: any) {
					for (let y = 0; y < p.height; y += gridSize) {
						for (let x = 0; x < p.width; x += gridSize) {
							p.fill((x / gridSize + y / gridSize) % 2 === 0 ? '#000000' : '#232323');
							p.square(x, y, gridSize);
						}
					}
				}
			};

			const myP5 = new p5(Sketch, checkerboardRef.current);

			return () => {
				myP5.remove(); // Proper cleanup to remove the p5 instance when the component unmounts
			};
		}
	}, []);

	return <div ref={checkerboardRef} style={{ width: '100%', height: '100%' }} />;
};

export default CheckerboardCanvas;
