// --- HTML ELEMENTS SELECTOR ---
const photoTab = document.getElementById('photoTab');
const pdfTab = document.getElementById('pdfTab');
const photoBox = document.getElementById('photoBox');
const pdfBox = document.getElementById('pdfBox');

const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const originalSizeText = document.getElementById('originalSize');
const widthInput = document.getElementById('widthInput');
const targetSizeInput = document.getElementById('targetSizeInput');
const fileNameInput = document.getElementById('fileNameInput');
const resizeBtn = document.getElementById('resizeBtn');
const btnText = document.getElementById('btnText');

let originalImage = new Image();

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    return parseFloat((bytes / 1024).toFixed(2)) + ' KB';
}

// --- 1. TAB SWITCHING LOGIC ---
photoTab.addEventListener('click', () => {
    photoTab.classList.add('bg-blue-500', 'text-white');
    photoTab.classList.remove('text-gray-400');
    pdfTab.classList.remove('bg-red-600', 'text-white');
    pdfTab.classList.add('text-gray-400');
    photoBox.classList.remove('hidden');
    pdfBox.classList.add('hidden');
});

pdfTab.addEventListener('click', () => {
    pdfTab.classList.add('bg-red-600', 'text-white');
    pdfTab.classList.remove('text-gray-400');
    photoTab.classList.remove('bg-blue-500', 'text-white');
    photoTab.classList.add('text-gray-400');
    pdfBox.classList.remove('hidden');
    photoBox.classList.add('hidden');
});

// --- 2. SMART PHOTO RESIZER LOGIC ---
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    originalSizeText.innerText = formatBytes(file.size);
    const reader = new FileReader();
    reader.onload = function(event) {
        imagePreview.src = event.target.result;
        originalImage.src = event.target.result;
        previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

originalImage.onload = function() {
    widthInput.value = originalImage.width;
};

resizeBtn.addEventListener('click', function() {
    let baseWidth = parseInt(widthInput.value);
    const desiredKB = parseInt(targetSizeInput.value);

    if (!baseWidth || baseWidth <= 0) {
        alert('Please enter a valid width!');
        return;
    }

    // LOADING START
    resizeBtn.disabled = true;
    resizeBtn.classList.add('opacity-75', 'cursor-not-allowed');
    btnText.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Optimizing Quality...</span>`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const aspectRatio = originalImage.height / originalImage.width;
    let resizedImageURI = '';
    
    if (desiredKB && desiredKB > 0) {
        let bestURI = '';
        let bestSizeKB = 0;
        const minTarget = desiredKB;
        const maxTarget = desiredKB + 10; 
        let scale = 1.0;
        let quality = 0.95;

        function processChunk() {
            let currentWidth = baseWidth * scale;
            canvas.width = currentWidth;
            canvas.height = currentWidth * aspectRatio;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            
            resizedImageURI = canvas.toDataURL('image/jpeg', quality);
            const base64Length = resizedImageURI.split(',')[1].length;
            let currentSizeKB = (base64Length * 0.75) / 1024;

            if (bestURI === '' || Math.abs(currentSizeKB - minTarget) < Math.abs(bestSizeKB - minTarget)) {
                bestURI = resizedImageURI;
                bestSizeKB = currentSizeKB;
            }

            if ((currentSizeKB >= minTarget && currentSizeKB <= maxTarget) || scale < 0.15) {
                finishResize(bestURI);
                return;
            }

            if (quality > 0.35) {
                quality -= 0.05;
            } else {
                quality = 0.80;
                scale -= 0.08;
            }
            setTimeout(processChunk, 0);
        }
        processChunk();
    } else {
        canvas.width = baseWidth;
        canvas.height = baseWidth * aspectRatio;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        resizedImageURI = canvas.toDataURL('image/jpeg', 0.9);
        finishResize(resizedImageURI);
    }

    function finishResize(uri) {
        let userDefinedName = fileNameInput.value.trim();
        if (userDefinedName === '') userDefinedName = `flex-resized-${desiredKB || 'auto'}`;
        const downloadLink = document.createElement('a');
        downloadLink.download = `${userDefinedName}.jpg`;
        downloadLink.href = uri;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        resizeBtn.disabled = false;
        resizeBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        btnText.innerText = "Resize & Download";
    }
});
      
