import { newsTopics } from './topics.js';

const replicateProxy = "https://replicate-api-proxy.glitch.me";
let topicVectors = {};

const loadingMessages = [
    "Loading latest topics...",
    "Fine-tuning your experience...",
    "Generating your personalized results...",
    "Preparing most recent news...",
    "Getting news for you..."
];

let currentMessageIndex = 0;
let processedTopics = 0;
let totalTopics = 0;

function rotateLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.style.animation = 'none';
    loadingMessage.offsetHeight; // Trigger reflow
    loadingMessage.style.animation = null;
    loadingMessage.textContent = loadingMessages[currentMessageIndex];
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
}

function updateProgressBar(processed, total) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const percentage = (processed / total) * 100;
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Processing topics: ${processed} / ${total}`;
}

async function getWordVector(text) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';

    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "input": {
            "text_input": text,
            "modality": "text"
        }
    };

    try {
        const response = await fetch(replicateProxy + "/create_n_get/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const replicateJSON = await response.json();
        if (replicateJSON.output && replicateJSON.output.length > 0) {
            processedTopics++;
            updateProgressBar(processedTopics, totalTopics);
            loadingScreen.style.display = 'none';
            return replicateJSON.output;
        } else {
            throw new Error('API returned empty output');
        }
    } catch (error) {
        console.error("Error fetching word vector:", error);
        loadingScreen.style.display = 'none';
        return null;
    }
}

async function initializeTopics() {
    const mainContent = document.getElementById('main-content');
    mainContent.classList.add('hidden');

    rotateLoadingMessage();
    const messageInterval = setInterval(rotateLoadingMessage, 3000);

    // Reset progress
    processedTopics = 0;
    totalTopics = newsTopics.length;
    updateProgressBar(0, totalTopics);

    // Check if we have stored vectors in local storage
    const storedVectors = localStorage.getItem('topicVectors');
    if (storedVectors) {
        topicVectors = JSON.parse(storedVectors);
        // Update progress for stored vectors
        processedTopics = Object.keys(topicVectors).length;
        updateProgressBar(processedTopics, totalTopics);
    } else {
        for (const topic of newsTopics) {
            const vector = await getWordVector(topic);
            if (vector) {
                topicVectors[topic] = vector;
            }
        }
        // Save to local storage
        localStorage.setItem('topicVectors', JSON.stringify(topicVectors));
    }

    const topicsList = document.getElementById('topics-list');
    for (const topic of newsTopics) {
        const topicElement = document.createElement('div');
        topicElement.classList.add('topic');
        topicElement.textContent = topic;
        topicElement.addEventListener('click', () => showSimilarTopics(topic));
        
        const thumbsUp = document.createElement('i');
        thumbsUp.classList.add('fas', 'fa-thumbs-up', 'thumbs-up');
        thumbsUp.addEventListener('click', (e) => {
            e.stopPropagation();
            // Add your thumbs-up logic here
            console.log('Thumbs up for:', topic);
        });
        topicElement.appendChild(thumbsUp);

        const deleteButton = document.createElement('i');
        deleteButton.classList.add('fas', 'fa-times', 'delete-button');
        deleteButton.style.display = 'none';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTopic(topic, topicElement);
        });
        topicElement.appendChild(deleteButton);

        topicsList.appendChild(topicElement);
    }

    mainContent.classList.remove('hidden');
}

function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2) return 0;
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
}

function showSimilarTopics(selectedTopic) {
    const topicElements = document.querySelectorAll('.topic');
    const selectedElement = Array.from(topicElements).find(el => el.textContent.includes(selectedTopic));
    
    topicElements.forEach(el => {
        el.classList.remove('selected', 'faded');
        el.querySelector('.thumbs-up').style.display = 'block';
        el.querySelector('.delete-button').style.display = 'none';
    });
    
    selectedElement.classList.add('selected');

    const similarTopics = newsTopics
        .filter(topic => topic !== selectedTopic)
        .map(topic => ({
            topic,
            similarity: cosineSimilarity(topicVectors[selectedTopic], topicVectors[topic])
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

    const similarTopicElements = similarTopics.map(({ topic }) => 
        Array.from(topicElements).find(el => el.textContent.includes(topic))
    );

    topicElements.forEach(el => {
        if (el !== selectedElement && !similarTopicElements.includes(el)) {
            el.classList.add('faded');
            el.querySelector('.thumbs-up').style.display = 'none';
            el.querySelector('.delete-button').style.display = 'block';
        }
    });
}

function deleteTopic(topic, element) {
    if (confirm(`Are you sure you want to delete "${topic}"?`)) {
        element.remove();
        const index = newsTopics.indexOf(topic);
        if (index > -1) {
            newsTopics.splice(index, 1);
        }
        delete topicVectors[topic];
        localStorage.setItem('topicVectors', JSON.stringify(topicVectors));
    }
}

initializeTopics();