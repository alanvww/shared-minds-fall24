import {
	initializeTranscriber,
	transcribeAudio,
	resampleAudio,
} from './whisper.js';

const openAIProxy = 'https://openai-api-proxy.glitch.me';
const chatMessages = document.getElementById('chat-messages');
const textInput = document.getElementById('text-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');
const status = document.getElementById('status');

let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// Define the two prompts
const emotionalPrompt =
	'You are my friend with a highly emotional personality. You respond to user inputs with great enthusiasm, empathy, and expressiveness. Use emotive language, exclamations, and convey a range of feelings in your responses. Always stay in character.';
const logicalPrompt =
	'You are my friend with a purely logical and analytical personality. You respond to user inputs with clear, concise, and well-structured arguments. Avoid emotional language and focus on facts, data, and rational thinking. Always stay in character.';

// Function to randomly select a prompt
function getRandomPrompt() {
	return Math.random() < 0.5 ? emotionalPrompt : logicalPrompt;
}

// Initialize the transcriber
async function init() {
	try {
		const message = await initializeTranscriber();
		status.textContent = message;
	} catch (error) {
		status.textContent = error.message;
	}
}

init();

sendButton.addEventListener('click', sendMessage);
voiceButton.addEventListener('click', toggleVoiceInput);
textInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
	const message = textInput.value.trim();
	if (message) {
		addMessageToChat(message, 'user');
		textInput.value = '';
		getAIResponse(message);
	}
}

function setInputState(disabled) {
	textInput.disabled = disabled;
	sendButton.disabled = disabled;
	voiceButton.disabled = disabled;
	textInput.style.backgroundColor = disabled ? '#f0f0f0' : 'white';
}

async function getAIResponse(message, targetElement = null) {
	status.textContent = 'Typing...';
	setInputState(true);

	if (!targetElement) {
		targetElement = addMessageToChat('Typing...', 'ai');
	} else {
		targetElement.textContent = 'Typing...';
	}

	try {
		const selectedPrompt = getRandomPrompt();
		const response = await fetch(`${openAIProxy}/AskOpenAI/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo-instruct',
				prompt: `${selectedPrompt}\n\nUser: ${message}\nAI:`,
				temperature: 0.7,
				max_tokens: 150,
			}),
		});
		const data = await response.json();
		const aiMessage = data.choices[0].text.trim();

		updateAIMessage(targetElement, aiMessage);
		status.textContent = 'Ready to chat!';
	} catch (error) {
		console.error('Error getting AI response:', error);
		status.textContent = 'Error getting AI response. Please try again.';
		updateAIMessage(
			targetElement,
			'Sorry, there was an error. Please try again.'
		);
	} finally {
		setInputState(false);
	}
}

function addMessageToChat(message, sender) {
	const messageElement = document.createElement('div');
	messageElement.classList.add('message', `${sender}-message`);

	const textElement = document.createElement('span');
	textElement.textContent = message;
	messageElement.appendChild(textElement);

	if (sender === 'user') {
		const remixButton = document.createElement('button');
		remixButton.textContent = '🔀';
		remixButton.classList.add('remix-button');
		remixButton.addEventListener('click', () => remixMessage(textElement));
		messageElement.appendChild(remixButton);

		messageElement.addEventListener(
			'mouseenter',
			() => (remixButton.style.display = 'flex')
		);
		messageElement.addEventListener(
			'mouseleave',
			() => (remixButton.style.display = 'none')
		);
	}

	chatMessages.appendChild(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
	return messageElement;
}

function updateAIMessage(element, newMessage) {
	element.textContent = newMessage;
}

function remixMessage(textElement) {
	const originalMessage = textElement.textContent;
	const words = originalMessage.split(' ');

	// More random remixing algorithm
	for (let i = words.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[words[i], words[j]] = [words[j], words[i]];
	}

	const remixedMessage = words.join(' ');
	textElement.textContent = remixedMessage;

	// Get a new AI response based on the remixed message
	const messageElement = textElement.closest('.message');
	const aiMessageElement = messageElement.nextElementSibling;
	if (aiMessageElement && aiMessageElement.classList.contains('ai-message')) {
		getAIResponse(remixedMessage, aiMessageElement);
	}
}

function toggleVoiceInput() {
	if (!isRecording) {
		startRecording();
	} else {
		stopRecording();
	}
}

async function startRecording() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.ondataavailable = (event) => {
			audioChunks.push(event.data);
		};
		mediaRecorder.onstop = processAudio;
		mediaRecorder.start();
		isRecording = true;
		voiceButton.textContent = '⏹️';
		status.textContent = 'Recording...';
	} catch (err) {
		console.error('Error accessing microphone:', err);
		status.textContent =
			'Unable to access the microphone. Please check your browser settings.';
	}
}

function stopRecording() {
	mediaRecorder.stop();
	isRecording = false;
	voiceButton.textContent = '🎤';
	status.textContent = 'Processing audio...';
}

async function processAudio() {
	const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
	audioChunks = [];

	try {
		const audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();
		const audioBuffer = await audioContext.decodeAudioData(
			await audioBlob.arrayBuffer()
		);
		const audioData = audioBuffer.getChannelData(0);
		const resampledData = resampleAudio(
			audioData,
			audioBuffer.sampleRate,
			16000
		);
		const transcription = await transcribeAudio(resampledData);
		addMessageToChat(transcription, 'user');
		getAIResponse(transcription);
		status.textContent = 'Ready to chat!';
	} catch (error) {
		console.error('Error processing audio:', error);
		status.textContent = error.message;
	}
}
