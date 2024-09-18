let clearButton;
let genButton;
let handPose;
let hands = [];
let video;
let myResultP;
let resultImage;

let scaleX = 280 / 374;
let scaleY = 280 / 280;

const url = 'https://replicate-api-proxy.glitch.me/create_n_get/';

// Instance for doodle canvas
let doodleSketch = function (p) {
	p.setup = function () {
		let canvas = p.createCanvas(280, 280, 'sketchCanvas');
		p.background(255);
		p.stroke(0);
		p.strokeWeight(12);

		// Select existing buttons instead of creating new ones
		clearButton = p.select('#clearButton');
		clearButton.mousePressed(() => p.clearCanvas());

		genButton = p.select('#genButton');
		genButton.mousePressed(() => generateImageFromSketch(p));
	};

	p.draw = function () {
		p.translate(280, 0);
		p.scale(-1, 1);
		p.drawHands();
	};

	p.clearCanvas = function () {
		p.background(255);
	};

	p.drawHands = function () {
		hands.forEach((hand) => {
			let thumbTip = hand.thumb_tip;
			let indexTip = hand.index_finger_tip;
			if (thumbTip && indexTip) {
				let distance = p.dist(
					thumbTip.x * scaleX,
					thumbTip.y * scaleY,
					indexTip.x * scaleX,
					indexTip.y * scaleY
				);
				if (distance < 15) {
					p.fill(0);
					p.circle(thumbTip.x * scaleX, thumbTip.y * scaleY, 2);
				}
			}
		});
	};
};

// Instance for camera view
let cameraSketch = function (p) {
	p.setup = function () {
		p.createCanvas(280, 280, 'cameraCanvas');
		video = p.createCapture(p.VIDEO);
		video.hide();
		video.size(374, 280);
		handPose.detectStart(video, gotHands);
	};

	p.draw = function () {
		p.translate(280, 0);
		p.scale(-1, 1);
		p.image(video, 0, 0, 280, 280, 374 / 2 - 140, 0, 280, 280);
		p.fill(255, 255, 255, 150);
		p.noStroke();
		p.rect(0, 0, p.width, p.height);
		p.drawHands();
	};

	p.drawHands = function () {
		hands.forEach((hand) => {
			let thumbTip = hand.thumb_tip;
			let indexTip = hand.index_finger_tip;
			p.stroke(0, 255, 0);
			p.strokeWeight(12);
			p.circle(thumbTip.x * scaleX, thumbTip.y * scaleY, 2);
			p.circle(indexTip.x * scaleX, indexTip.y * scaleY, 2);
		});
	};
};

// Load models and initialize p5 instances
modelLoader().then(() => {
	new p5(doodleSketch, 'doodleSketchContainer');
	new p5(cameraSketch, 'cameraSketchContainer');
});

function modelLoader() {
	return new Promise((resolve) => {
		handPose = ml5.handPose({ maxHands: 1 }, () => {
			resolve();
		});
	});
}

function gotHands(results) {
	hands = results;
}

async function generateImageFromSketch(p) {
	const canvas = document.getElementById('defaultCanvas0');
	const imageData = canvas.toDataURL('image/png');

	document.body.style.cursor = 'progress';
	const data = {
		version: 'feb7325e48612a443356bff3d0e03af21a42570f87bee6e8ea4f275f2bd3e6f9',
		input: {
			image: imageData,
			scale: 2,
			prompt: 'a photo of a thing',
			cn_lineart_strength: 1,
		},
	};
	console.log('Making a Fetch Request', data);
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify(data),
		mode: 'cors',
		credentials: 'omit',
	};
	try {
		const raw_response = await fetch(url, options);
		if (!raw_response.ok) {
			throw new Error(`HTTP error! status: ${raw_response.status}`);
		}
		const json_response = await raw_response.json();
		document.body.style.cursor = 'auto';
		displayResult(json_response.output);
		console.log('Response', json_response);
	} catch (error) {
		console.error(
			'There was a problem with the fetch operation:',
			error.message
		);
		document.body.style.cursor = 'auto';
		alert('There was an error generating the image. Please try again.');
	}
}

function displayResult(imageUrl) {
	if (!resultImage) {
		resultImage = document.createElement('img');
		resultImage.id = 'resultImage';
		document.querySelector('.container').appendChild(resultImage);
	}
	resultImage.src = imageUrl;
}
