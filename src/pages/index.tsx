import Image from 'next/image';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';

import CheckerboardCanvas from '../components/CheckerboardCanvas';
import PatternCanvas from '../components/PatternCanvas';

const inter = Inter({ subsets: ['latin'] });

interface Pixel {
	x: number;
	y: number;
	color: string;
}

const colors = ['#FDFBE5', '#232323', '#957169', '#CAD8BF', '#8CD3DD', '#FFF6A0', '#EE0000', '#FF4D00', '#FF9FE4'];

export default function Home() {
	const [imageData, setImageData] = useState(null);
	const [fgColor, setFgColor] = useState(colors[0]);
	const [bgColor, setBgColor] = useState(colors[1]);
	const [redrawTrigger, setRedrawTrigger] = useState(0); // This state is used to trigger redraws

	const handleImageChange = (event: any) => {
		const file = event.target.files[0];
		if (file && file.type.startsWith('image')) {
			const reader = new FileReader();

			reader.onload = (e) => {
				//@ts-ignore
				setImageData(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRedraw = () => {
		setRedrawTrigger(redrawTrigger + 1); // Incrementing this state will trigger a re-render of the p5 sketch
	};

	return (
		<main className={`flex h-screen lg:flex-row flex-col items-start justify-start ${inter.className}`}>
			<div className="w-1/4 h-full self-center p-4 flex flex-col gap-4 bg-white">
				<p>Pixel Pattern</p>
				<div className="p-4 border flex flex-col gap-4">
					<label htmlFor="imageInput">Choose an image</label>
					<input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} />
				</div>
				<div className="p-4 border flex flex-col gap-4">
					<label htmlFor="imageInput">Select a foreground color</label>
					<div className="grid grid-cols-5 gap-1">
						{colors.map((color) => (
							<button
								key={color}
								onClick={() => setFgColor(color)}
								className="w-full aspect-square"
								style={{
									backgroundColor: color,
									border: fgColor === color ? '1px solid white' : 'none',
									outline: fgColor === color ? '1px solid black' : 'none',
								}}
							/>
						))}
					</div>
				</div>
				<div className="p-4 border flex flex-col gap-4">
					<label htmlFor="imageInput">Select a background color</label>
					<div className="grid grid-cols-5 gap-1">
						{colors.map((color) => (
							<button
								key={color}
								onClick={() => setBgColor(color)}
								className="w-full aspect-square outline outline-red-400"
								style={{
									backgroundColor: color,
									border: bgColor === color ? '1px solid white' : 'none',
									outline: bgColor === color ? '1px solid black' : 'none',
								}}
							/>
						))}
					</div>
				</div>
				<button onClick={handleRedraw} className="border p-4">
					Redraw Mask
				</button>
			</div>
			<div
				id="canvas-container"
				className="w-3/4 grow bg-black h-full overflow-hidden flex flex-col justify-center items-center relative">
				<div className="z-10">
					<PatternCanvas imageData={imageData} fgColor={fgColor} bgColor={bgColor} redrawTrigger={redrawTrigger} />
				</div>

				<div
					id="canvas-container-bg"
					className="flex flex-wrap overflow-hidden h-screen w-full absolute top-0 bottom-0 left-0"
					style={{}}>
					<CheckerboardCanvas />
				</div>
			</div>
		</main>
	);
}
