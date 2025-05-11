document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const camera = document.getElementById('camera');
    const captureBtn = document.getElementById('captureBtn');
    const solveBtn = document.getElementById('solveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const autoScanBtn = document.getElementById('autoScanBtn');
    const calibrateBtn = document.getElementById('calibrateBtn');
    const colorPicker = document.getElementById('colorPicker');
    const currentFacePreview = document.getElementById('currentFacePreview');
    const solutionDiv = document.getElementById('solution');
    const solutionSteps = document.getElementById('solutionSteps');
    const progressIndicator = document.getElementById('progressIndicator');
    const processingMessage = document.getElementById('processingMessage');
    const processingText = document.getElementById('processingText');
    const overlay = document.getElementById('overlay');
    const captureCanvas = document.getElementById('captureCanvas');
    const processingCanvas = document.getElementById('processingCanvas');
    const editModal = document.getElementById('editModal');
    const modalColorPicker = document.getElementById('modalColorPicker');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const confirmEditBtn = document.getElementById('confirmEditBtn');
    const historyList = document.getElementById('historyList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Canvas contexts
    const overlayCtx = overlay.getContext('2d');
    const captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true });
    const processingCtx = processingCanvas.getContext('2d', { willReadFrequently: true });
    
    // State
    let stream = null;
    let currentColor = 'white';
    let scannedFaces = {
        white: null,
        red: null,
        blue: null,
        green: null,
        orange: null,
        yellow: null
    };
    let faceOrder = [];
    let colorCalibration = {
        white: { r: 255, g: 255, b: 255 },
        red: { r: 255, g: 0, b: 0 },
        blue: { r: 0, g: 0, b: 255 },
        green: { r: 0, g: 255, b: 0 },
        orange: { r: 255, g: 165, b: 0 },
        yellow: { r: 255, g: 255, b: 0 }
    };
    let isProcessing = false;
    let cvReady = false;
    let currentEditingSticker = null;
    let currentEditingFace = null;
    
    // Face scanning order for auto-scan
    const scanningOrder = ['white', 'green', 'red', 'blue', 'orange', 'yellow'];
    let currentScanningStep = 0;
    
    // Color mapping for the solver
    const colorMap = {
        white: 'U',
        red: 'R',
        blue: 'B',
        green: 'F',
        orange: 'L',
        yellow: 'D'
    };
    
    // Initialize OpenCV
    function onOpenCvReady() {
        cvReady = true;
        console.log('OpenCV is ready');
    }
    
    // Check if OpenCV is already loaded
    if (window.cv) {
        onOpenCvReady();
    } else {
        // Set callback when OpenCV is ready
        window.onOpenCvReady = onOpenCvReady;
    }
    
    // Initialize tabs
    function initTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                    }
                });
                
                // Load history if needed
                if (tabId === 'history') {
                    loadHistory();
                }
            });
        });
    }
    
    // Initialize camera
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            camera.srcObject = stream;
            
            // Start drawing overlay
            requestAnimationFrame(drawOverlay);
        } catch (err) {
            console.error("Ошибка при доступе к камере:", err);
            alert("Не удалось получить доступ к камере. Пожалуйста, разрешите использование камеры и обновите страницу.");
        }
    }
    
    // Draw overlay with face detection guide
    function drawOverlay() {
        if (!stream) return;
        
        const video = camera;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Set canvas dimensions to match video
        overlay.width = videoWidth;
        overlay.height = videoHeight;
        
        // Clear overlay
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        
        // Draw face detection guide (3x3 grid)
        const centerX = overlay.width / 2;
        const centerY = overlay.height / 2;
        const size = Math.min(overlay.width, overlay.height) * 0.6;
        
        overlayCtx.strokeStyle = '#00FF00';
        overlayCtx.lineWidth = 2;
        
        // Outer square
        overlayCtx.strokeRect(
            centerX - size/2,
            centerY - size/2,
            size,
            size
        );
        
        // Grid lines
        for (let i = 1; i < 3; i++) {
            // Vertical lines
            overlayCtx.beginPath();
            overlayCtx.moveTo(centerX - size/2 + (size/3)*i, centerY - size/2);
            overlayCtx.lineTo(centerX - size/2 + (size/3)*i, centerY + size/2);
            overlayCtx.stroke();
            
            // Horizontal lines
            overlayCtx.beginPath();
            overlayCtx.moveTo(centerX - size/2, centerY - size/2 + (size/3)*i);
            overlayCtx.lineTo(centerX + size/2, centerY - size/2 + (size/3)*i);
            overlayCtx.stroke();
        }
        
        // Draw instructions
        overlayCtx.fillStyle = '#00FF00';
        overlayCtx.font = '16px Montserrat';
        overlayCtx.textAlign = 'center';
        overlayCtx.fillText('Поместите грань кубика в эту область', centerX, centerY - size/2 - 10);
        
        requestAnimationFrame(drawOverlay);
    }
    
    // Initialize color picker
    function initColorPicker() {
        const colors = [
            { name: 'white', hex: '#FFFFFF', display: 'Белая (верх)' },
            { name: 'red', hex: '#FF0000', display: 'Красная (право)' },
            { name: 'blue', hex: '#0000FF', display: 'Синяя (зад)' },
            { name: 'green', hex: '#00FF00', display: 'Зелёная (перед)' },
            { name: 'orange', hex: '#FFA500', display: 'Оранжевая (лево)' },
            { name: 'yellow', hex: '#FFFF00', display: 'Жёлтая (низ)' }
        ];
        
        colors.forEach((color, index) => {
            // Main color picker
            const option = document.createElement('div');
            option.className = 'color-option';
            if (color.name === currentColor) option.classList.add('selected');
            option.style.backgroundColor = color.hex;
            option.setAttribute('data-color', color.name);
            option.setAttribute('title', color.display);
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-check';
            option.appendChild(icon);
            
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                currentColor = this.getAttribute('data-color');
                updateCurrentFaceDisplay();
            });
            
            colorPicker.appendChild(option);
            
            // Modal color picker
            const modalOption = option.cloneNode(true);
            modalOption.addEventListener('click', function() {
                document.querySelectorAll('#modalColorPicker .color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
            modalColorPicker.appendChild(modalOption);
        });
    }
    
    // Initialize progress indicator
    function initProgressIndicator() {
        scanningOrder.forEach((color, index) => {
            const circle = document.createElement('div');
            circle.className = 'progress-face';
            circle.style.backgroundColor = getColorHex(color);
            circle.setAttribute('data-color', color);
            circle.setAttribute('data-step', index + 1);
            progressIndicator.appendChild(circle);
        });
    }
    
    // Update progress indicator
    function updateProgressIndicator() {
        document.querySelectorAll('.progress-face').forEach(circle => {
            const color = circle.getAttribute('data-color');
            if (scannedFaces[color]) {
                circle.classList.add('scanned');
            } else {
                circle.classList.remove('scanned');
            }
            
            circle.classList.remove('current');
        });
    }
    
    // Get color hex code
    function getColorHex(color) {
        const colors = {
            white: '#FFFFFF',
            red: '#FF0000',
            blue: '#0000FF',
            green: '#00FF00',
            orange: '#FFA500',
            yellow: '#FFFF00'
        };
        return colors[color] || '#000000';
    }
    
    // Get color name in Russian
    function getColorName(color) {
        const names = {
            white: 'Белая (верх)',
            red: 'Красная (право)',
            blue: 'Синяя (зад)',
            green: 'Зелёная (перед)',
            orange: 'Оранжевая (лево)',
            yellow: 'Жёлтая (низ)'
        };
        return names[color] || color;
    }
    
    // Update current face display
    function updateCurrentFaceDisplay() {
        // Clear preview
        currentFacePreview.innerHTML = '';
        
        // Create 3x3 grid
        for (let i = 0; i < 9; i++) {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            sticker.style.backgroundColor = getColorHex(currentColor);
            sticker.setAttribute('data-index', i);
            
            // Add click event for manual correction
            sticker.addEventListener('click', function() {
                if (scannedFaces[currentColor]) {
                    openEditModal(currentColor, parseInt(this.getAttribute('data-index')));
                }
            });
            
            currentFacePreview.appendChild(sticker);
        }
        
        // Update progress indicator
        document.querySelectorAll('.progress-face').forEach(circle => {
            circle.classList.remove('current');
            if (circle.getAttribute('data-color') === currentColor) {
                circle.classList.add('current');
            }
        });
    }
    
    // Open edit modal for manual correction
    function openEditModal(faceColor, stickerIndex) {
        currentEditingFace = faceColor;
        currentEditingSticker = stickerIndex;
        
        // Select current color in modal
        const currentStickerColor = scannedFaces[faceColor][stickerIndex];
        document.querySelectorAll('#modalColorPicker .color-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.getAttribute('data-color') === currentStickerColor) {
                opt.classList.add('selected');
            }
        });
        
        editModal.classList.add('show');
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.classList.remove('show');
    }
    
    // Apply manual correction
    function applyStickerCorrection() {
        const selectedColor = document.querySelector('#modalColorPicker .color-option.selected').getAttribute('data-color');
        scannedFaces[currentEditingFace][currentEditingSticker] = selectedColor;
        
        // Update face preview
        updateFacePreview(currentEditingFace, scannedFaces[currentEditingFace]);
        closeEditModal();
        
        // Save to localStorage
        saveState();
    }
    
    // Capture image from camera
    function captureImage() {
        if (!stream) return null;
        
        const video = camera;
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        // Set canvas dimensions
        captureCanvas.width = width;
        captureCanvas.height = height;
        
        // Draw video frame to canvas
        captureCtx.drawImage(video, 0, 0, width, height);
        
        return captureCanvas.toDataURL('image/jpeg');
    }
    
    // Process image to detect colors
    async function processImage() {
        if (!cvReady) {
            alert("Библиотека обработки изображений ещё не загружена. Пожалуйста, подождите.");
            return null;
        }
        
        isProcessing = true;
        processingMessage.style.display = 'flex';
        processingText.textContent = "Обработка изображения...";
        
        try {
            // Create OpenCV image from canvas
            const src = cv.imread(captureCanvas);
            const dst = new cv.Mat();
            
            // Convert to grayscale for edge detection
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
            
            // Apply Gaussian blur
            cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
            
            // Detect edges
            cv.Canny(dst, dst, 50, 150, 3, false);
            
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // Find the largest contour (assuming it's the cube face)
            let maxArea = 0;
            let maxContour = null;
            
            for (let i = 0; i < contours.size(); ++i) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > maxArea) {
                    maxArea = area;
                    maxContour = contour;
                }
            }
            
            if (!maxContour) {
                alert("Не удалось обнаружить грань кубика. Убедитесь, что грань хорошо видна в рамке.");
                return null;
            }
            
            // Approximate the contour to get a square
            const epsilon = 0.05 * cv.arcLength(maxContour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(maxContour, approx, epsilon, true);
            
            if (approx.rows !== 4) {
                alert("Не удалось распознать квадратную грань. Попробуйте ещё раз.");
                return null;
            }
            
            // Get the four corners of the square
            const corners = [];
            for (let i = 0; i < 4; i++) {
                corners.push({
                    x: approx.data32S[i * 2],
                    y: approx.data32S[i * 2 + 1]
                });
            }
            
            // Sort corners: top-left, top-right, bottom-right, bottom-left
            corners.sort((a, b) => a.y - b.y);
            const topCorners = corners.slice(0, 2).sort((a, b) => a.x - b.x);
            const bottomCorners = corners.slice(2, 4).sort((a, b) => a.x - b.x);
            const sortedCorners = [
                topCorners[0], // top-left
                topCorners[1], // top-right
                bottomCorners[1], // bottom-right
                bottomCorners[0]  // bottom-left
            ];
            
            // Perspective transform to get a square image of the face
            const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                sortedCorners[0].x, sortedCorners[0].y,
                sortedCorners[1].x, sortedCorners[1].y,
                sortedCorners[2].x, sortedCorners[2].y,
                sortedCorners[3].x, sortedCorners[3].y
            ]);
            
            const size = 300;
            const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0, 0,
                size, 0,
                size, size,
                0, size
            ]);
            
            const perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
            const warped = new cv.Mat();
            cv.warpPerspective(src, warped, perspectiveMatrix, new cv.Size(size, size));
            
            // Process the warped image to detect colors
            processingText.textContent = "Определение цветов...";
            const faceColors = detectFaceColors(warped);
            
            // Verify that the center color matches the selected face
            if (faceColors[4] !== currentColor) {
                alert(`Центральный цвет (${faceColors[4]}) не соответствует выбранной грани (${currentColor}). Пожалуйста, проверьте калибровку цветов.`);
                return null;
            }
            
            // Verify that all colors are recognized
            const unrecognized = faceColors.filter(color => !colorCalibration[color]);
            if (unrecognized.length > 0) {
                alert("Некоторые цвета не распознаны. Пожалуйста, откалибруйте цвета и попробуйте ещё раз.");
                return null;
            }
            
            // Clean up
            src.delete();
            dst.delete();
            contours.delete();
            hierarchy.delete();
            approx.delete();
            srcPoints.delete();
            dstPoints.delete();
            perspectiveMatrix.delete();
            warped.delete();
            
            return faceColors;
        } catch (error) {
            console.error("Ошибка при обработке изображения:", error);
            return null;
        } finally {
            isProcessing = false;
            processingMessage.style.display = 'none';
        }
    }
    
    // Detect colors in a face image
    function detectFaceColors(faceImage) {
        const size = faceImage.rows;
        const cellSize = size / 3;
        const face = [];
        
        // Create a temporary canvas for color detection
        processingCanvas.width = size;
        processingCanvas.height = size;
        cv.imshow(processingCanvas, faceImage);
        
        // Sample each sticker (3x3 grid)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                // Get center of the sticker
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                // Sample a small area to avoid noise
                const sampleSize = 15;
                const sampleData = processingCtx.getImageData(
                    x - sampleSize/2, y - sampleSize/2, 
                    sampleSize, sampleSize
                ).data;
                
                // Calculate average color
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < sampleData.length; i += 4) {
                    r += sampleData[i];
                    g += sampleData[i + 1];
                    b += sampleData[i + 2];
                }
                
                const pixelCount = sampleData.length / 4;
                r = Math.round(r / pixelCount);
                g = Math.round(g / pixelCount);
                b = Math.round(b / pixelCount);
                
                // Find the closest calibrated color
                const detectedColor = findClosestColor(r, g, b);
                face.push(detectedColor);
            }
        }
        
        return face;
    }
    
    // Find the closest calibrated color
    function findClosestColor(r, g, b) {
        let minDistance = Infinity;
        let closestColor = 'unknown';
        
        for (const color in colorCalibration) {
            const calib = colorCalibration[color];
            const distance = Math.sqrt(
                Math.pow(r - calib.r, 2) + 
                Math.pow(g - calib.g, 2) + 
                Math.pow(b - calib.b, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        return closestColor;
    }
    
    // Calibrate color
    calibrateBtn.addEventListener('click', async function() {
        if (isProcessing) return;
        
        processingText.textContent = "Калибровка цвета...";
        processingMessage.style.display = 'flex';
        
        // Small delay to show processing message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture center of the image
        const video = camera;
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        captureCanvas.width = width;
        captureCanvas.height = height;
        captureCtx.drawImage(video, 0, 0, width, height);
        
        // Sample center area
        const sampleSize = 50;
        const x = width / 2 - sampleSize / 2;
        const y = height / 2 - sampleSize / 2;
        
        const sampleData = captureCtx.getImageData(x, y, sampleSize, sampleSize).data;
        
        // Calculate average color
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < sampleData.length; i += 4) {
            r += sampleData[i];
            g += sampleData[i + 1];
            b += sampleData[i + 2];
        }
        
        const pixelCount = sampleData.length / 4;
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        
        // Update calibration
        colorCalibration[currentColor] = { r, g, b };
        
        // Save to localStorage
        saveState();
        
        processingMessage.style.display = 'none';
        
        alert(`Цвет "${getColorName(currentColor)}" откалиброван: RGB(${r}, ${g}, ${b})`);
    });
    
    // Capture face
    captureBtn.addEventListener('click', async function() {
        if (isProcessing) return;
        
        // Capture image
        captureImage();
        
        // Process image
        const faceColors = await processImage();
        if (!faceColors) return;
        
        // Save the face
        scannedFaces[currentColor] = faceColors;
        faceOrder.push(currentColor);
        
        // Update UI
        updateFacePreview(currentColor, faceColors);
        updateProgressIndicator();
        checkAllFacesScanned();
        
        // Save to localStorage
        saveState();
        
        alert(`Грань ${getColorName(currentColor)} сохранена!`);
    });
    
    // Auto-scan all faces
    autoScanBtn.addEventListener('click', async function() {
        if (isProcessing) return;
        
        currentScanningStep = 0;
        await autoScanNextFace();
    });
    
    // Auto-scan next face
    async function autoScanNextFace() {
        if (currentScanningStep >= scanningOrder.length) {
            alert("Все грани отсканированы!");
            return;
        }
        
        currentColor = scanningOrder[currentScanningStep];
        updateCurrentFaceDisplay();
        
        // Highlight current face in progress indicator
        document.querySelectorAll('.progress-face').forEach(circle => {
            circle.classList.remove('current');
            if (circle.getAttribute('data-color') === currentColor) {
                circle.classList.add('current');
            }
        });
        
        const scanConfirmed = confirm(`Пожалуйста, подготовьте ${getColorName(currentColor)} грань и нажмите OK для сканирования.`);
        
        if (!scanConfirmed) {
            alert("Авто-сканирование прервано.");
            return;
        }
        
        // Add small delay to allow user to position the cube
        processingText.textContent = "Готовимся к сканированию...";
        processingMessage.style.display = 'flex';
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Capture and process
        captureImage();
        const faceColors = await processImage();
        
        if (!faceColors) {
            alert("Не удалось обработать грань. Попробуйте ещё раз.");
            return;
        }
        
        // Save face
        scannedFaces[currentColor] = faceColors;
        faceOrder.push(currentColor);
        
        // Update UI
        updateFacePreview(currentColor, faceColors);
        updateProgressIndicator();
        checkAllFacesScanned();
        
        // Save to localStorage
        saveState();
        
        currentScanningStep++;
        
        // Continue with next face
        await autoScanNextFace();
    }
    
    // Update face preview
    function updateFacePreview(color, face) {
        // Update the progress indicator
        const faceElement = document.querySelector(`.progress-face[data-color="${color}"]`);
        if (faceElement) {
            faceElement.classList.add('scanned');
        }
        
        // Update the face preview
        currentFacePreview.innerHTML = '';
        
        face.forEach((stickerColor, index) => {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            sticker.style.backgroundColor = getColorHex(stickerColor);
            sticker.setAttribute('data-index', index);
            
            // Add click event for manual correction
            sticker.addEventListener('click', function() {
                openEditModal(color, parseInt(this.getAttribute('data-index')));
            });
            
            currentFacePreview.appendChild(sticker);
        });
    }
    
    // Check if all faces are scanned
    function checkAllFacesScanned() {
        const allScanned = Object.values(scannedFaces).every(face => face !== null);
        solveBtn.disabled = !allScanned;
        
        // Show/hide solution section
        if (allScanned) {
            solutionDiv.classList.add('show');
        } else {
            solutionDiv.classList.remove('show');
        }
    }
    
// Solve the cube
solveBtn.addEventListener('click', function() {
    if (Object.values(scannedFaces).some(face => face === null)) {
        alert("Пожалуйста, отсканируйте все грани перед решением.");
        return;
    }

    // Convert our representation to the format expected by the solver
    const cubeState = convertToSolverFormat();
    
    try {
        // Use the rubiks-cube-solver library (v1.2.0)
        const solver = new RubiksCubeSolver();
        const solution = solver.solve(cubeState);
        displaySolution(solution);
        
        // Save to history
        saveToHistory(cubeState, solution);
    } catch (error) {
        console.error("Ошибка при решении кубика:", error);
        alert("Не удалось решить кубик. Пожалуйста, проверьте правильность введённых цветов.");
    }
});
    
    // Convert to solver format
    function convertToSolverFormat() {
        // The solver expects faces in order: U, R, F, D, L, B
        // Map our scanned faces to the solver's format
        const solverFaces = {};
        
        for (const color in scannedFaces) {
            const face = scannedFaces[color];
            const solverColor = colorMap[color];
            
            // Convert our face array to a string
            solverFaces[solverColor] = face.map(c => colorMap[c] || '?').join('');
        }
        
        // The solver expects the cube state in a specific order
        return [
            solverFaces['U'] || 'UUUUUUUUU', // Up (white)
            solverFaces['R'] || 'RRRRRRRRR', // Right (red)
            solverFaces['F'] || 'FFFFFFFFF', // Front (green)
            solverFaces['D'] || 'DDDDDDDDD', // Down (yellow)
            solverFaces['L'] || 'LLLLLLLLL', // Left (orange)
            solverFaces['B'] || 'BBBBBBBBB'  // Back (blue)
        ];
    }
    
    // Display solution
    function displaySolution(steps) {
        solutionSteps.innerHTML = '';
        
        if (!steps || steps.length === 0) {
            solutionSteps.innerHTML = '<div class="step">Кубик уже собран!</div>';
            return;
        }
        
        // Translate notations to Russian
        const translations = {
            "U": "Верх (U) ↻",
            "U'": "Верх (U') ↺",
            "U2": "Верх (U2) 180°",
            "D": "Низ (D) ↻",
            "D'": "Низ (D') ↺",
            "D2": "Низ (D2) 180°",
            "L": "Лево (L) ↻",
            "L'": "Лево (L') ↺",
            "L2": "Лево (L2) 180°",
            "R": "Право (R) ↻",
            "R'": "Право (R') ↺",
            "R2": "Право (R2) 180°",
            "F": "Перед (F) ↻",
            "F'": "Перед (F') ↺",
            "F2": "Перед (F2) 180°",
            "B": "Зад (B) ↻",
            "B'": "Зад (B') ↺",
            "B2": "Зад (B2) 180°"
        };
        
        steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step';
            
            const stepNumber = document.createElement('div');
            stepNumber.className = 'step-number';
            stepNumber.textContent = index + 1;
            stepElement.appendChild(stepNumber);
            
            const stepText = document.createElement('div');
            stepText.textContent = translations[step] || step;
            stepElement.appendChild(stepText);
            
            // Add rotation icon
            const stepIcon = document.createElement('div');
            stepIcon.className = 'step-icon';
            
            if (step.includes("'")) {
                stepIcon.innerHTML = '<i class="fas fa-undo"></i>';
            } else if (step.includes("2")) {
                stepIcon.innerHTML = '<i class="fas fa-redo"></i>';
            } else {
                stepIcon.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
            
            stepElement.appendChild(stepIcon);
            
            solutionSteps.appendChild(stepElement);
        });
        
        // Scroll to solution
        solutionDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Save current state to localStorage
    function saveState() {
        const state = {
            scannedFaces,
            colorCalibration,
            faceOrder,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('rubikscanState', JSON.stringify(state));
    }
    
    // Load state from localStorage
    function loadState() {
        const savedState = localStorage.getItem('rubikscanState');
        if (!savedState) return;
        
        try {
            const state = JSON.parse(savedState);
            
            // Validate loaded state
            if (state.scannedFaces && state.colorCalibration && state.faceOrder) {
                scannedFaces = state.scannedFaces;
                colorCalibration = state.colorCalibration;
                faceOrder = state.faceOrder;
                
                // Update UI
                updateProgressIndicator();
                checkAllFacesScanned();
                
                // Update preview for current face
                if (scannedFaces[currentColor]) {
                    updateFacePreview(currentColor, scannedFaces[currentColor]);
                } else {
                    updateCurrentFaceDisplay();
                }
            }
        } catch (error) {
            console.error("Ошибка при загрузке состояния:", error);
        }
    }
    
    // Save solution to history
    function saveToHistory(cubeState, solution) {
        const history = JSON.parse(localStorage.getItem('rubikscanHistory') || '[]');
        
        history.unshift({
            date: new Date().toISOString(),
            cubeState,
            solution,
            faces: {...scannedFaces}
        });
        
        // Keep only last 10 solutions
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('rubikscanHistory', JSON.stringify(history));
    }
    
    // Load history from localStorage
    function loadHistory() {
        historyList.innerHTML = '';
        
        const history = JSON.parse(localStorage.getItem('rubikscanHistory') || '[]');
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #636E72;">История пуста</p>';
            return;
        }
        
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.date);
            const dateStr = date.toLocaleString();
            
            const movesCount = item.solution ? item.solution.length : 0;
            
            historyItem.innerHTML = `
                <div>
                    <strong>Решение #${index + 1}</strong>
                    <div>${movesCount} шагов</div>
                </div>
                <div class="history-date">${dateStr}</div>
            `;
            
            historyItem.addEventListener('click', function() {
                if (confirm("Загрузить это состояние кубика?")) {
                    scannedFaces = {...item.faces};
                    faceOrder = Object.keys(item.faces).filter(color => item.faces[color] !== null);
                    
                    // Update UI
                    updateProgressIndicator();
                    checkAllFacesScanned();
                    
                    // Show solution if all faces are scanned
                    if (Object.values(scannedFaces).every(face => face !== null)) {
                        displaySolution(item.solution);
                        solutionDiv.classList.add('show');
                    }
                    
                    // Switch to scan tab
                    document.querySelector('.tab[data-tab="scan"]').click();
                }
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Reset everything
    resetBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите сбросить все отсканированные грани и калибровку?")) {
            // Reset scanned faces
            for (const color in scannedFaces) {
                scannedFaces[color] = null;
            }
            faceOrder = [];
            
            // Reset calibration to defaults
            colorCalibration = {
                white: { r: 255, g: 255, b: 255 },
                red: { r: 255, g: 0, b: 0 },
                blue: { r: 0, g: 0, b: 255 },
                green: { r: 0, g: 255, b: 0 },
                orange: { r: 255, g: 165, b: 0 },
                yellow: { r: 255, g: 255, b: 0 }
            };
            
            // Reset UI
            solveBtn.disabled = true;
            solutionDiv.classList.remove('show');
            updateCurrentFaceDisplay();
            updateProgressIndicator();
            
            // Clear saved state
            localStorage.removeItem('rubikscanState');
        }
    });
    
    // Modal events
    cancelEditBtn.addEventListener('click', closeEditModal);
    confirmEditBtn.addEventListener('click', applyStickerCorrection);
    
    // Initialize
    initColorPicker();
    initProgressIndicator();
    initTabs();
    updateCurrentFaceDisplay();
    loadState();
    initCamera();
});