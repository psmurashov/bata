// Глобальные переменные
let cvReady = false;
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
let currentEditingSticker = null;
let currentEditingFace = null;

// Порядок сканирования граней
const scanningOrder = ['white', 'green', 'red', 'blue', 'orange', 'yellow'];
let currentScanningStep = 0;

// Соответствие цветов для solver'а
const colorMap = {
    white: 'U',
    red: 'R',
    blue: 'B',
    green: 'F',
    orange: 'L',
    yellow: 'D'
};

// Основная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем загрузку OpenCV
    if (!window.cv) {
        console.error('OpenCV not loaded');
        alert('Библиотека обработки изображений не загружена. Пожалуйста, обновите страницу.');
        return;
    }
    
    // Инициализация интерфейса
    initColorPicker();
    initProgressIndicator();
    initTabs();
    initModal();
    updateCurrentFaceDisplay();
    loadState();
    initCamera();
    
    // Проверяем загрузку solver'а
    if (!window.RubiksCubeSolver) {
        console.error('RubiksCubeSolver not loaded');
        alert('Библиотека решения кубика не загружена. Пожалуйста, обновите страницу.');
    }
});

// Инициализация камеры
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        document.getElementById('camera').srcObject = stream;
        requestAnimationFrame(drawOverlay);
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Не удалось получить доступ к камере. Пожалуйста, разрешите использование камеры.");
    }
}

// Отрисовка overlay для камеры
function drawOverlay() {
    const video = document.getElementById('camera');
    const overlay = document.getElementById('overlay');
    
    if (!stream || !video.videoWidth) {
        requestAnimationFrame(drawOverlay);
        return;
    }
    
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');
    
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    const centerX = overlay.width / 2;
    const centerY = overlay.height / 2;
    const size = Math.min(overlay.width, overlay.height) * 0.6;
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
    
    // Grid lines
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - size/2 + (size/3)*i, centerY - size/2);
        ctx.lineTo(centerX - size/2 + (size/3)*i, centerY + size/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY - size/2 + (size/3)*i);
        ctx.lineTo(centerX + size/2, centerY - size/2 + (size/3)*i);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText('Поместите грань кубика в эту область', centerX, centerY - size/2 - 10);
    
    requestAnimationFrame(drawOverlay);
}

// Инициализация color picker
function initColorPicker() {
    const colors = [
        { name: 'white', hex: '#FFFFFF', display: 'Белая (верх)' },
        { name: 'red', hex: '#FF0000', display: 'Красная (право)' },
        { name: 'blue', hex: '#0000FF', display: 'Синяя (зад)' },
        { name: 'green', hex: '#00FF00', display: 'Зелёная (перед)' },
        { name: 'orange', hex: '#FFA500', display: 'Оранжевая (лево)' },
        { name: 'yellow', hex: '#FFFF00', display: 'Жёлтая (низ)' }
    ];
    
    const colorPicker = document.getElementById('colorPicker');
    const modalColorPicker = document.getElementById('modalColorPicker');
    
    colors.forEach(color => {
        // Main picker
        const option = createColorOption(color);
        option.addEventListener('click', () => {
            currentColor = color.name;
            updateCurrentFaceDisplay();
        });
        colorPicker.appendChild(option);
        
        // Modal picker
        const modalOption = createColorOption(color);
        modalColorPicker.appendChild(modalOption);
    });
    
    function createColorOption(color) {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.style.backgroundColor = color.hex;
        option.setAttribute('data-color', color.name);
        option.setAttribute('title', color.display);
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-check';
        option.appendChild(icon);
        
        return option;
    }
}

// Инициализация индикатора прогресса
function initProgressIndicator() {
    const progressIndicator = document.getElementById('progressIndicator');
    
    scanningOrder.forEach((color, index) => {
        const circle = document.createElement('div');
        circle.className = 'progress-face';
        circle.style.backgroundColor = getColorHex(color);
        circle.setAttribute('data-color', color);
        circle.setAttribute('data-step', index + 1);
        progressIndicator.appendChild(circle);
    });
}

// Инициализация модального окна
function initModal() {
    const editModal = document.getElementById('editModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const confirmBtn = document.getElementById('confirmEditBtn');
    
    cancelBtn.addEventListener('click', () => editModal.classList.remove('show'));
    confirmBtn.addEventListener('click', applyStickerCorrection);
    
    // Обработчик выбора цвета в модальном окне
    document.getElementById('modalColorPicker').addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('#modalColorPicker .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            e.target.classList.add('selected');
        }
    });
}

// Обновление текущей грани
function updateCurrentFaceDisplay() {
    const currentFacePreview = document.getElementById('currentFacePreview');
    currentFacePreview.innerHTML = '';
    
    // Обновляем выбранный цвет в picker'е
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-color') === currentColor) {
            opt.classList.add('selected');
        }
    });
    
    // Создаем preview грани
    for (let i = 0; i < 9; i++) {
        const sticker = document.createElement('div');
        sticker.className = 'sticker';
        sticker.style.backgroundColor = getColorHex(currentColor);
        sticker.setAttribute('data-index', i);
        
        if (scannedFaces[currentColor]) {
            sticker.style.backgroundColor = getColorHex(scannedFaces[currentColor][i]);
            sticker.addEventListener('click', () => {
                openEditModal(currentColor, i);
            });
        }
        
        currentFacePreview.appendChild(sticker);
    }
    
    // Обновляем индикатор прогресса
    updateProgressIndicator();
}

// Открытие модального окна для редактирования
function openEditModal(faceColor, stickerIndex) {
    currentEditingFace = faceColor;
    currentEditingSticker = stickerIndex;
    
    const currentColor = scannedFaces[faceColor][stickerIndex];
    document.querySelectorAll('#modalColorPicker .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-color') === currentColor) {
            opt.classList.add('selected');
        }
    });
    
    document.getElementById('editModal').classList.add('show');
}

// Применение изменений цвета
function applyStickerCorrection() {
    const selectedOption = document.querySelector('#modalColorPicker .color-option.selected');
    if (!selectedOption) return;
    
    const selectedColor = selectedOption.getAttribute('data-color');
    scannedFaces[currentEditingFace][currentEditingSticker] = selectedColor;
    
    updateCurrentFaceDisplay();
    document.getElementById('editModal').classList.remove('show');
    saveState();
}

// Получение HEX кода цвета
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

// Получение названия цвета
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

// Обновление индикатора прогресса
function updateProgressIndicator() {
    document.querySelectorAll('.progress-face').forEach(circle => {
        const color = circle.getAttribute('data-color');
        circle.classList.toggle('scanned', !!scannedFaces[color]);
        circle.classList.toggle('current', color === currentColor);
    });
}

// Проверка завершенности сканирования
function checkAllFacesScanned() {
    const allScanned = Object.values(scannedFaces).every(face => face !== null);
    document.getElementById('solveBtn').disabled = !allScanned;
    document.getElementById('solution').classList.toggle('show', allScanned);
}

// Инициализация вкладок
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            if (tabId === 'history') {
                loadHistory();
            }
        });
    });
}

// Захват изображения с камеры
function captureImage() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('captureCanvas');
    
    if (!stream || !video.videoWidth) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg');
}

// Обработка изображения с OpenCV
async function processImage() {
    if (!window.cv || !window.cv.Mat) {
        throw new Error('OpenCV not initialized');
    }
    
    let src, dst, contours, hierarchy, approx, srcPoints, dstPoints, perspectiveMatrix, warped;
    
    const processingMessage = document.getElementById('processingMessage');
    const processingText = document.getElementById('processingText');
    
    isProcessing = true;
    processingMessage.style.display = 'flex';
    processingText.textContent = "Обработка изображения...";
    
    try {
        // 1. Захватываем изображение с камеры
        src = cv.imread('captureCanvas');
        dst = new cv.Mat();
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        
        // 2. Улучшаем изображение для обнаружения граней
        // Конвертируем в grayscale
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        
        // Увеличиваем контраст
        cv.convertScaleAbs(dst, dst, 1.5, 0);
        
        // Применяем размытие
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
        
        // Детектируем края (используем адаптивный порог)
        const thresholdValue = cv.mean(dst)[0];
        cv.Canny(dst, dst, Math.max(0, thresholdValue * 0.5), Math.min(255, thresholdValue * 1.5), 3, false);
        
        // 3. Находим контуры
        cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // 4. Ищем подходящий контур (квадратную грань)
        let maxArea = 0;
        let maxContour = null;
        
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            // Фильтруем слишком маленькие области
            if (area < 1000) continue;
            
            // Аппроксимируем контур
            const epsilon = 0.05 * cv.arcLength(contour, true);
            approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, epsilon, true);
            
            // Проверяем, что это квадрат (4 угла)
            if (approx.rows === 4 && area > maxArea) {
                maxArea = area;
                maxContour = approx;
            } else {
                approx.delete();
            }
        }
        
        if (!maxContour) {
            throw new Error("Не удалось обнаружить грань кубика. Убедитесь, что грань полностью видна в рамке и хорошо освещена.");
        }
        
        // 5. Перспективное преобразование
        const size = 300;
        srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, getCorners(maxContour));
        dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0, size, 0, size, size, 0, size
        ]);
        
        perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
        warped = new cv.Mat();
        cv.warpPerspective(src, warped, perspectiveMatrix, new cv.Size(size, size));
        
        // 6. Определение цветов
        processingText.textContent = "Определение цветов...";
        const faceColors = detectFaceColors(warped);
        
        // Проверка центрального цвета
        if (faceColors[4] !== currentColor) {
            throw new Error(`Центральный цвет (${faceColors[4]}) не соответствует выбранной грани (${currentColor}). Проверьте калибровку цветов.`);
        }
        
        return faceColors;
    } finally {
        // Освобождаем ресурсы
        [src, dst, contours, hierarchy, approx, srcPoints, dstPoints, perspectiveMatrix, warped]
            .forEach(obj => obj && !obj.isDeleted && obj.delete());
        
        isProcessing = false;
        processingMessage.style.display = 'none';
    }
}


/*async function processImage() {
    if (!window.cv || !window.cv.Mat) {
        throw new Error('OpenCV not initialized');
    }
    
    // Объявляем все переменные в начале функции
    let src, dst, contours, hierarchy, approx, srcPoints, dstPoints, perspectiveMatrix, warped;
    
    const processingMessage = document.getElementById('processingMessage');
    const processingText = document.getElementById('processingText');
    
    isProcessing = true;
    processingMessage.style.display = 'flex';
    processingText.textContent = "Обработка изображения...";
    
    try {
        src = cv.imread('captureCanvas');
        dst = new cv.Mat();
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        
        // Преобразование и обработка изображения
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
        cv.Canny(dst, dst, 50, 150, 3, false);
        cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // Находим наибольший контур
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
            throw new Error("Не удалось обнаружить грань кубика");
        }
        
        // Аппроксимация контура
        const epsilon = 0.05 * cv.arcLength(maxContour, true);
        approx = new cv.Mat();
        cv.approxPolyDP(maxContour, approx, epsilon, true);
        
        if (approx.rows !== 4) {
            throw new Error("Не удалось распознать квадратную грань");
        }
        
        // Перспективное преобразование
        const size = 300;
        srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, getCorners(approx));
        dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0, size, 0, size, size, 0, size
        ]);
        
        perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
        warped = new cv.Mat();
        cv.warpPerspective(src, warped, perspectiveMatrix, new cv.Size(size, size));
        
        // Определение цветов
        processingText.textContent = "Определение цветов...";
        const faceColors = detectFaceColors(warped);
        
        // Проверка центрального цвета
        if (faceColors[4] !== currentColor) {
            throw new Error(`Центральный цвет (${faceColors[4]}) не соответствует выбранной грани (${currentColor})`);
        }
        
        return faceColors;
    } finally {
        // Освобождение ресурсов
        if (src) src.delete();
        if (dst) dst.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
        if (approx) approx.delete();
        if (srcPoints) srcPoints.delete();
        if (dstPoints) dstPoints.delete();
        if (perspectiveMatrix) perspectiveMatrix.delete();
        if (warped) warped.delete();
        
        isProcessing = false;
        processingMessage.style.display = 'none';
    }
}*/

// Получение углов квадрата
function getCorners(approx) {
    const corners = [];
    for (let i = 0; i < 4; i++) {
        corners.push({
            x: approx.data32S[i * 2],
            y: approx.data32S[i * 2 + 1]
        });
    }
    
    // Сортировка углов
    corners.sort((a, b) => a.y - b.y);
    const topCorners = corners.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottomCorners = corners.slice(2, 4).sort((a, b) => a.x - b.x);
    
    return [
        topCorners[0].x, topCorners[0].y,
        topCorners[1].x, topCorners[1].y,
        bottomCorners[1].x, bottomCorners[1].y,
        bottomCorners[0].x, bottomCorners[0].y
    ];
}

// Определение цветов на грани
function detectFaceColors(faceImage) {
    const size = faceImage.rows;
    const cellSize = size / 3;
    const face = [];
    const canvas = document.getElementById('processingCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    cv.imshow(canvas, faceImage);
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            const sampleSize = 15;
            
            const sampleData = ctx.getImageData(
                x - sampleSize/2, y - sampleSize/2, 
                sampleSize, sampleSize
            ).data;
            
            // Вычисление среднего цвета
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
            
            // Поиск ближайшего цвета
            face.push(findClosestColor(r, g, b));
        }
    }
    
    return face;
}

// Поиск ближайшего цвета
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

// Калибровка цвета
document.getElementById('calibrateBtn').addEventListener('click', async function() {
    if (isProcessing) return;
    
    const processingMessage = document.getElementById('processingMessage');
    const processingText = document.getElementById('processingText');
    
    processingText.textContent = "Калибровка цвета...";
    processingMessage.style.display = 'flex';
    
    try {
        const video = document.getElementById('camera');
        const canvas = document.getElementById('captureCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const sampleSize = 50;
        const x = canvas.width / 2 - sampleSize / 2;
        const y = canvas.height / 2 - sampleSize / 2;
        
        const sampleData = ctx.getImageData(x, y, sampleSize, sampleSize).data;
        
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < sampleData.length; i += 4) {
            r += sampleData[i];
            g += sampleData[i + 1];
            b += sampleData[i + 2];
        }
        
        const pixelCount = sampleData.length / 4;
        colorCalibration[currentColor] = {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount)
        };
        
        saveState();
        alert(`Цвет "${getColorName(currentColor)}" откалиброван: RGB(${colorCalibration[currentColor].r}, ${colorCalibration[currentColor].g}, ${colorCalibration[currentColor].b})`);
    } catch (error) {
        console.error("Calibration error:", error);
        alert("Ошибка при калибровке цвета");
    } finally {
        processingMessage.style.display = 'none';
    }
});

// Захват грани
document.getElementById('captureBtn').addEventListener('click', async function() {
    if (isProcessing) return;
    
    try {
        if (scannedFaces[currentColor] && !confirm(`Грань ${getColorName(currentColor)} уже отсканирована. Перезаписать?`)) {
            return;
        }
        
        captureImage();
        const faceColors = await processImage();
        
        scannedFaces[currentColor] = faceColors;
        faceOrder.push(currentColor);
        
        updateCurrentFaceDisplay();
        checkAllFacesScanned();
        saveState();
        
        alert(`Грань ${getColorName(currentColor)} сохранена!`);
    } catch (error) {
        console.error("Capture error:", error);
        alert(`Ошибка: ${error.message}`);
    }
});

// Авто-сканирование
document.getElementById('autoScanBtn').addEventListener('click', async function() {
    if (isProcessing) return;
    
    currentScanningStep = 0;
    await autoScanNextFace();
});

async function autoScanNextFace() {
    if (currentScanningStep >= scanningOrder.length) {
        alert("Все грани отсканированы!");
        return;
    }
    
    currentColor = scanningOrder[currentScanningStep];
    updateCurrentFaceDisplay();
    
    if (!confirm(`Пожалуйста, подготовьте ${getColorName(currentColor)} грань и нажмите OK для сканирования.`)) {
        alert("Авто-сканирование прервано.");
        return;
    }
    
    const processingMessage = document.getElementById('processingMessage');
    const processingText = document.getElementById('processingText');
    
    processingText.textContent = "Готовимся к сканированию...";
    processingMessage.style.display = 'flex';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        captureImage();
        const faceColors = await processImage();
        
        scannedFaces[currentColor] = faceColors;
        faceOrder.push(currentColor);
        
        updateCurrentFaceDisplay();
        checkAllFacesScanned();
        saveState();
        
        currentScanningStep++;
        await autoScanNextFace();
    } catch (error) {
        console.error("Auto-scan error:", error);
        alert(`Ошибка при сканировании: ${error.message}`);
    } finally {
        processingMessage.style.display = 'none';
    }
}

// Решение кубика
document.getElementById('solveBtn').addEventListener('click', function() {
    if (Object.values(scannedFaces).some(face => face === null)) {
        alert("Пожалуйста, отсканируйте все грани перед решением.");
        return;
    }
    
    try {
        const cubeState = convertToSolverFormat();
        const solver = new RubiksCubeSolver();
        const solution = solver.solve(cubeState);
        
        displaySolution(solution);
        saveToHistory(cubeState, solution);
    } catch (error) {
        console.error("Solving error:", error);
        alert("Не удалось решить кубик. Пожалуйста, проверьте правильность введённых цветов.");
    }
});

// Преобразование в формат solver'а
function convertToSolverFormat() {
    const solverFaces = {};
    
    for (const color in scannedFaces) {
        solverFaces[colorMap[color]] = scannedFaces[color].map(c => colorMap[c]).join('');
    }
    
    return [
        solverFaces['U'] || 'UUUUUUUUU',
        solverFaces['R'] || 'RRRRRRRRR',
        solverFaces['F'] || 'FFFFFFFFF',
        solverFaces['D'] || 'DDDDDDDDD',
        solverFaces['L'] || 'LLLLLLLLL',
        solverFaces['B'] || 'BBBBBBBBB'
    ];
}

// Отображение решения
function displaySolution(steps) {
    const solutionSteps = document.getElementById('solutionSteps');
    solutionSteps.innerHTML = '';
    
    if (!steps || steps.length === 0) {
        solutionSteps.innerHTML = '<div class="step">Кубик уже собран!</div>';
        return;
    }
    
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
    
    document.getElementById('solution').scrollIntoView({ behavior: 'smooth' });
}

// Сохранение состояния
function saveState() {
    const state = {
        scannedFaces,
        colorCalibration,
        faceOrder,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('rubikscanState', JSON.stringify(state));
}

// Загрузка состояния
function loadState() {
    const savedState = localStorage.getItem('rubikscanState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        
        if (state.scannedFaces && state.colorCalibration && state.faceOrder) {
            scannedFaces = state.scannedFaces;
            colorCalibration = state.colorCalibration;
            faceOrder = state.faceOrder;
            
            updateProgressIndicator();
            checkAllFacesScanned();
            
            if (scannedFaces[currentColor]) {
                updateFacePreview(currentColor, scannedFaces[currentColor]);
            } else {
                updateCurrentFaceDisplay();
            }
        }
    } catch (error) {
        console.error("Load state error:", error);
    }
}

// Сохранение в историю
function saveToHistory(cubeState, solution) {
    const history = JSON.parse(localStorage.getItem('rubikscanHistory') || '[]');
    
    history.unshift({
        date: new Date().toISOString(),
        cubeState,
        solution,
        faces: {...scannedFaces}
    });
    
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('rubikscanHistory', JSON.stringify(history));
}

// Загрузка истории
function loadHistory() {
    const historyList = document.getElementById('historyList');
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
        const movesCount = item.solution ? item.solution.length : 0;
        
        historyItem.innerHTML = `
            <div>
                <strong>Решение #${index + 1}</strong>
                <div>${movesCount} шагов</div>
            </div>
            <div class="history-date">${date.toLocaleString()}</div>
        `;
        
        historyItem.addEventListener('click', function() {
            if (confirm("Загрузить это состояние кубика?")) {
                scannedFaces = {...item.faces};
                faceOrder = Object.keys(item.faces).filter(color => item.faces[color] !== null);
                
                updateProgressIndicator();
                checkAllFacesScanned();
                
                if (Object.values(scannedFaces).every(face => face !== null)) {
                    displaySolution(item.solution);
                    document.getElementById('solution').classList.add('show');
                }
                
                document.querySelector('.tab[data-tab="scan"]').click();
            }
        });
        
        historyList.appendChild(historyItem);
    });
}

// Сброс
document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm("Вы уверены, что хотите сбросить все отсканированные грани и калибровку?")) {
        for (const color in scannedFaces) {
            scannedFaces[color] = null;
        }
        faceOrder = [];
        
        colorCalibration = {
            white: { r: 255, g: 255, b: 255 },
            red: { r: 255, g: 0, b: 0 },
            blue: { r: 0, g: 0, b: 255 },
            green: { r: 0, g: 255, b: 0 },
            orange: { r: 255, g: 165, b: 0 },
            yellow: { r: 255, g: 255, b: 0 }
        };
        
        document.getElementById('solveBtn').disabled = true;
        document.getElementById('solution').classList.remove('show');
        updateCurrentFaceDisplay();
        updateProgressIndicator();
        
        localStorage.removeItem('rubikscanState');
    }
});