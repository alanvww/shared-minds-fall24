const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let imageArray = [];
let requestCounter = 0;

init();

function init() {
    initInterface();
    createPlaceholderCarousel();
}

function createPlaceholderCarousel() {
    const imgList = document.getElementById('imageList');
    imgList.innerHTML = '';

    // Start with 3 placeholders
    document.documentElement.style.setProperty('--total', 3);
    const angleStep = 360 / 3;

    // Create 3 placeholder divs
    for (let i = 0; i < 3; i++) {
        const placeholder = document.createElement("div");
        placeholder.classList.add('image-item', 'placeholder-item');
        const angle = i * angleStep;
        placeholder.style.setProperty('--index', i);
        placeholder.style.setProperty('--angle', `${angle}deg`);
        imgList.appendChild(placeholder);
    }
}

function createLoadingIndicator() {
    requestCounter++;
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading-indicator');
    loadingDiv.id = `loading-${requestCounter}`;
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-number">${requestCounter}</div>
            <div class="loading-text">Generating images...</div>
        </div>
    `;
    document.querySelector('.container').appendChild(loadingDiv);
    return loadingDiv;
}

async function askPictures(prompt) {
    console.log("Starting request for prompt:", prompt);
    document.body.style.cursor = "progress";

    const loadingDiv = createLoadingIndicator();

    const data = {
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
            prompt: prompt,
        },
    };

    console.log("Making a Fetch Request", data);

    try {
        const picture_info = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: 'application/json',
            },
            body: JSON.stringify(data),
        });

        const proxy_said = await picture_info.json();
        console.log("Received response:", proxy_said);

        if (proxy_said.output && proxy_said.output.length > 0) {
            imageArray = [...imageArray, ...proxy_said.output];
            console.log("Updated image array length:", imageArray.length);
            recalculateAndRender();
        } else {
            console.log("No images received in response");
        }
    } catch (error) {
        console.error("Error fetching images:", error);
        createPlaceholderCarousel();
    } finally {
        loadingDiv.remove();
        document.body.style.cursor = "auto";
    }
}

function recalculateAndRender() {
    // Use actual array length if it's more than 3, otherwise use 3
    const totalItems = Math.max(3, imageArray.length);
    document.documentElement.style.setProperty('--total', totalItems);
    const angleStep = 360 / totalItems;

    console.log("Recalculating carousel parameters:", {
        actualImages: imageArray.length,
        totalItems,
        angleStep,
        usingMinimum: imageArray.length <= 3
    });

    updateCarousel(totalItems, angleStep);

    const imageList = document.getElementById('imageList');
    const carousel = document.getElementById('carousel');
    const isHovered = carousel.matches(':hover');
    imageList.style.animationPlaybackRate = isHovered ? 0.333 : 1;
}

function updateCarousel(totalPositions, angleStep) {
    const imgList = document.getElementById('imageList');
    imgList.innerHTML = '';

    if (imageArray.length === 0) {
        // If no images, create 3 placeholders
        for (let i = 0; i < 3; i++) {
            const placeholder = document.createElement("div");
            placeholder.classList.add('image-item', 'placeholder-item');
            const angle = i * angleStep;
            placeholder.style.setProperty('--index', i);
            placeholder.style.setProperty('--angle', `${angle}deg`);
            imgList.appendChild(placeholder);
        }
        return;
    }

    // If we have images but less than 3, fill remaining spots with placeholders
    const itemsToCreate = Math.max(3, imageArray.length);

    for (let i = 0; i < itemsToCreate; i++) {
        if (i < imageArray.length) {
            // Create image element
            const img = document.createElement("img");
            img.src = imageArray[i];
            img.classList.add('image-item');
            const angle = i * angleStep;
            img.style.setProperty('--index', i);
            img.style.setProperty('--angle', `${angle}deg`);

            img.onload = () => console.log(`Image ${i + 1} loaded successfully`);
            img.onerror = () => {
                console.error(`Error loading image ${i + 1}`);
                img.remove();
                // Replace with placeholder on error
                const placeholder = document.createElement("div");
                placeholder.classList.add('image-item', 'placeholder-item');
                placeholder.style.setProperty('--index', i);
                placeholder.style.setProperty('--angle', `${angle}deg`);
                imgList.appendChild(placeholder);
            };

            imgList.appendChild(img);
        } else if (imageArray.length < 3) {
            // Create placeholder for remaining spots up to 3
            const placeholder = document.createElement("div");
            placeholder.classList.add('image-item', 'placeholder-item');
            const angle = i * angleStep;
            placeholder.style.setProperty('--index', i);
            placeholder.style.setProperty('--angle', `${angle}deg`);
            imgList.appendChild(placeholder);
        }
    }
}

function initInterface() {
    const inputBox = document.getElementById('inputBox');
    inputBox.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const inputValue = inputBox.value.trim();
            if (inputValue) {
                console.log("New prompt entered:", inputValue);
                askPictures(inputValue);
                inputBox.value = '';
            }
        }
    });
}