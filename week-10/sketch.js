// sketch.js
let handPose;
let video, videoWidth, videoHeight;
let hands = [];
let draggableElements = [];
const PINCH_THRESHOLD = 50;
const API_URL = "https://replicate-api-proxy.glitch.me/create_n_get/";
let imageArray = [];
let isGenerating = false;

function preload() {
    handPose = ml5.handPose({ maxHands: 2, flipped: true });
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');

    // Setup video
    videoWidth = width;
    videoHeight = width * 480 / 640;
    video = createCapture(VIDEO, { flipped: true });
    video.size(videoWidth, videoHeight);
    video.hide();

    // Start hand detection
    handPose.detectStart(video, gotHands);

    // Initialize draggable elements
    initializeDraggableElements();

    // Initialize input handling
    initializePromptInput();
}

function initializeDraggableElements() {
    const elements = document.querySelectorAll('.draggable');
    elements.forEach(element => {
        const dragHandler = new DraggableHandler(element);
        draggableElements.push(dragHandler);
    });
}

function initializePromptInput() {
    const promptInput = document.getElementById('promptInput');
    promptInput.addEventListener('keydown', async function(event) {
        if (event.key === 'Enter' && !isGenerating) {
            const prompt = this.value.trim();
            if (prompt) {
                await generateImages(prompt);
                this.value = '';
            }
        }
    });
}

async function generateImages(prompt) {
    const apiStatus = document.getElementById('api-status');
    const apiStatusText = document.getElementById('api-status-text');

    try {
        isGenerating = true;
        apiStatus.className = 'status-dot loading';
        apiStatusText.textContent = 'Generating...';

        const data = {
            version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
            input: {
                prompt: prompt,
            },
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.output && result.output.length > 0) {
            imageArray = [...imageArray, ...result.output];
            createFloatingImages(result.output);
            apiStatus.className = 'status-dot active';
            apiStatusText.textContent = 'Generated Successfully';
        } else {
            throw new Error('No images received');
        }
    } catch (error) {
        console.error('Error generating images:', error);
        apiStatus.className = 'status-dot error';
        apiStatusText.textContent = 'Error Generating Images';
    } finally {
        isGenerating = false;
    }
}

function createFloatingImages(images) {
    images.forEach(imageUrl => {
        // Create new image element
        const img = document.createElement('img');
        img.className = 'floating-image draggable';
        img.src = imageUrl;
        img.alt = 'Generated image';

        // Generate random position within viewport
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;
        
        const randomX = Math.max(0, Math.floor(Math.random() * maxX));
        const randomY = Math.max(0, Math.floor(Math.random() * maxY));

        // Set initial position
        img.style.left = `${randomX}px`;
        img.style.top = `${randomY}px`;

        // Add to document
        document.body.appendChild(img);

        // Initialize draggable behavior
        const dragHandler = new DraggableHandler(img);
        draggableElements.push(dragHandler);
    });
}

class DraggableHandler {
    constructor(element) {
        this.element = element;
        this.isDragging = false;
        this.isHandDragging = false;
        this.isMouseDragging = false;
        this.isTwoHandResizing = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.initialHandPositions = null;
        this.initialDimensions = null;
        
        this.header = element.querySelector('.card-header');
        
        if (this.header) {
            this.initMouseDrag(this.header);
        } else {
            this.initMouseDrag(this.element);
        }

        if (element.classList.contains('floating-image')) {
            this.initImageBehavior();
        }

        this.element.addEventListener('dblclick', () => {
            const currentWidth = parseInt(getComputedStyle(this.element).width);
            this.element.style.width = `${currentWidth + 50}px`;
            if (this.element.classList.contains('floating-image')) {
                this.element.style.height = `${currentWidth + 50}px`;
            }
        });
    }

    initImageBehavior() {
        this.element.addEventListener('load', () => {
            this.element.style.opacity = '1';
        });

        this.element.addEventListener('error', () => {
            this.element.style.display = 'none';
        });

        this.element.addEventListener('mousedown', () => {
            this.element.classList.add('dragging');
        });

        document.addEventListener('mouseup', () => {
            this.element.classList.remove('dragging');
        });
    }

    initMouseDrag(dragElement) {
        dragElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            this.isMouseDragging = true;
            this.element.style.zIndex = '1000';
            
            const rect = this.element.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            if (getComputedStyle(this.element).position !== 'absolute') {
                this.element.style.position = 'absolute';
                this.element.style.left = `${rect.left}px`;
                this.element.style.top = `${rect.top}px`;
            }
            
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
            
            e.preventDefault();
        });
        
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }

    handleMouseMove(e) {
        if (!this.isMouseDragging) return;
        
        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;
        
        const maxX = window.innerWidth - this.element.offsetWidth;
        const maxY = window.innerHeight - this.element.offsetHeight;
        
        this.element.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
        this.element.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    }
    
    handleMouseUp() {
        this.isMouseDragging = false;
        this.element.style.zIndex = '1';
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    checkTwoHandResize(hands) {
        if (hands.length < 2 || this.isMouseDragging) return false;

        const hand1 = hands[0];
        const hand2 = hands[1];

        const pinch1Distance = dist(
            hand1.index_finger_tip.x, 
            hand1.index_finger_tip.y, 
            hand1.thumb_tip.x, 
            hand1.thumb_tip.y
        );

        const pinch2Distance = dist(
            hand2.index_finger_tip.x, 
            hand2.index_finger_tip.y, 
            hand2.thumb_tip.x, 
            hand2.thumb_tip.y
        );

        const pinch1Center = {
            x: (hand1.index_finger_tip.x + hand1.thumb_tip.x) / 2,
            y: (hand1.index_finger_tip.y + hand1.thumb_tip.y) / 2
        };

        const pinch2Center = {
            x: (hand2.index_finger_tip.x + hand2.thumb_tip.x) / 2,
            y: (hand2.index_finger_tip.y + hand2.thumb_tip.y) / 2
        };

        const rect = this.element.getBoundingClientRect();
        const elementCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        const handsMidpoint = {
            x: (pinch1Center.x + pinch2Center.x) / 2,
            y: (pinch1Center.y + pinch2Center.y) / 2
        };
        
        const distanceToElement = dist(
            elementCenter.x,
            elementCenter.y,
            handsMidpoint.x,
            handsMidpoint.y
        );

        const isNearElement = distanceToElement < rect.width;

        if (pinch1Distance < PINCH_THRESHOLD && pinch2Distance < PINCH_THRESHOLD && isNearElement) {
            if (!this.isTwoHandResizing) {
                this.isTwoHandResizing = true;
                this.isHandDragging = false;
                this.initialHandPositions = {
                    pinch1: pinch1Center,
                    pinch2: pinch2Center
                };
                this.initialDimensions = {
                    width: rect.width,
                    height: rect.height
                };
                this.element.style.zIndex = '1000';
            }

            // Calculate new dimensions based on hand movement
            const currentWidth = Math.abs(pinch1Center.x - pinch2Center.x);
            const currentHeight = Math.abs(pinch1Center.y - pinch2Center.y);
            
            // Calculate scaling factors
            const widthScale = currentWidth / Math.abs(
                this.initialHandPositions.pinch1.x - this.initialHandPositions.pinch2.x
            );
            const heightScale = currentHeight / Math.abs(
                this.initialHandPositions.pinch1.y - this.initialHandPositions.pinch2.y
            );

            // Apply scaling to initial dimensions
            let newWidth = this.initialDimensions.width * widthScale;
            let newHeight = this.initialDimensions.height * heightScale;

            // Apply constraints
            const minSize = 100;
            const maxWidth = window.innerWidth - rect.left;
            const maxHeight = window.innerHeight - rect.top;

            newWidth = Math.min(Math.max(newWidth, minSize), maxWidth);
            newHeight = Math.min(Math.max(newHeight, minSize), maxHeight);

            // Update element dimensions
            this.element.style.width = `${newWidth}px`;
            if (this.element.classList.contains('floating-image')) {
                this.element.style.height = `${newWidth}px`;  // Keep square for images
            } else {
                this.element.style.height = `${newHeight}px`;
            }

            return true;
        } else if (this.isTwoHandResizing) {
            this.isTwoHandResizing = false;
            this.initialHandPositions = null;
            this.initialDimensions = null;
            this.element.style.zIndex = '1';
        }

        return false;
    }

    checkPinch(indexTip, thumbTip) {
        if (this.isMouseDragging || this.isTwoHandResizing) return false;
        
        const distance = dist(indexTip.x, indexTip.y, thumbTip.x, thumbTip.y);

        if (distance < PINCH_THRESHOLD) {
            const rect = this.element.getBoundingClientRect();
            const handCenterX = (indexTip.x + thumbTip.x) / 2;
            const handCenterY = (indexTip.y + thumbTip.y) / 2;

            if (this.isPointInBounds({ x: handCenterX, y: handCenterY }, rect)) {
                if (!this.isHandDragging) {
                    this.isHandDragging = true;
                    this.offsetX = handCenterX - rect.left;
                    this.offsetY = handCenterY - rect.top;
                    this.element.style.zIndex = '1000';
                }
                return true;
            }
        } else if (this.isHandDragging) {
            this.isHandDragging = false;
            this.element.style.zIndex = '1';
        }
        return false;
    }

    isPointInBounds(point, rect) {
        return (
            point.x >= rect.left &&
            point.x <= rect.right &&
            point.y >= rect.top &&
            point.y <= rect.bottom
        );
    }

    update(indexTip, thumbTip) {
        if (this.isHandDragging && !this.isTwoHandResizing) {
            const x = indexTip.x - this.offsetX;
            const y = indexTip.y - this.offsetY;

            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;

            this.element.style.position = 'absolute';
            this.element.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
            this.element.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
        }
    }
}

function draw() {
    image(video, 0, 0, videoWidth, videoHeight);
    fill(255, 255, 255, 100);
    rect(0, 0, width, height);

    const confidenceElement = document.getElementById('confidence-value');
    const frameCountElement = document.getElementById('frame-count');

    if (hands.length > 0) {
        hands.forEach((hand, index) => {
            const confidence = (hand.confidence * 100).toFixed(1);
            confidenceElement.textContent = `${confidence}%`;
            frameCountElement.textContent = `${Math.round(frameRate())} FPS`;

            // Draw debug points for each hand
            const indexTip = hand.index_finger_tip;
            const thumbTip = hand.thumb_tip;

            if (indexTip && thumbTip) {
                fill(0, 0, 0, 60);
                noStroke();
                circle(indexTip.x, indexTip.y, 50);
                circle(thumbTip.x, thumbTip.y, 50);
            }
        });

        // Check for two-hand resize first
        let resizeHandled = false;
        if (hands.length === 2) {
            for (let element of draggableElements) {
                if (element.checkTwoHandResize(hands)) {
                    resizeHandled = true;
                    break;
                }
            }
        }

        // If no resize is happening, check for single-hand drag
        if (!resizeHandled && hands[0]) {
            const indexTip = hands[0].index_finger_tip;
            const thumbTip = hands[0].thumb_tip;

            if (indexTip && thumbTip) {
                for (let element of draggableElements) {
                    if (element.checkPinch(indexTip, thumbTip)) {
                        element.update(indexTip, thumbTip);
                        break;
                    }
                }
            }
        }
    } else {
        confidenceElement.textContent = "No hands detected";
        frameCountElement.textContent = `${Math.round(frameRate())} FPS`;
    }
}

function gotHands(results) {
    hands = results;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    videoWidth = width;
    videoHeight = width * 480 / 640;
    video.size(videoWidth, videoHeight);
}