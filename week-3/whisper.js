import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

let transcriber;

export async function initializeTranscriber() {
	try {
		transcriber = await pipeline(
			'automatic-speech-recognition',
			'Xenova/whisper-tiny.en'
		);
		return 'Model loaded. Ready to transcribe.';
	} catch (error) {
		console.error('Error initializing transcriber:', error);
		throw new Error('Error loading model. Please refresh the page.');
	}
}

export async function transcribeAudio(audioData) {
	if (!transcriber) {
		throw new Error('Transcriber not initialized');
	}
	try {
		const result = await transcriber(audioData);
		return result.text;
	} catch (error) {
		console.error('Error transcribing audio:', error);
		throw new Error(
			'An error occurred while processing the audio. Please try again.'
		);
	}
}

export function resampleAudio(audioData, oldSampleRate, newSampleRate) {
	const ratio = oldSampleRate / newSampleRate;
	const newLength = Math.round(audioData.length / ratio);
	const result = new Float32Array(newLength);

	for (let i = 0; i < newLength; i++) {
		const oldIndex = Math.floor(i * ratio);
		result[i] = audioData[oldIndex];
	}

	return result;
}
