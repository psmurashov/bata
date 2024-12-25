 //Проверка приборов
        function checkUserAgent() {
            const userAgent = navigator.userAgent.toLowerCase();
            const isAndroid = userAgent.includes('android');
            const isLampaClient = userAgent.includes('lampa_client');

            if (isAndroid && isLampaClient) {

                putScript('app.min.js?v=' + Math.random());

            } else {
                // Создаем черный фон с текстом "ведутся работы"
                document.body.style.backgroundColor = 'black';
                document.body.style.color = 'white';
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.margin = '0';
                document.body.style.fontFamily = 'Arial, sans-serif';
                document.body.style.fontSize = '24px';
                document.body.innerHTML = '<canvas id="gameCanvas" width="800" height="400"></canvas>';

            

//=============[pingPong]===>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем стили для canvas через JavaScript
canvas.style.display = 'block';
canvas.style.margin = 'auto';
canvas.style.backgroundColor = '#000';

const paddleWidth = 10;
const paddleHeight = 100;
const ballRadius = 10;

let playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0
};

let aiPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0
};

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: 2,
    dy: 2
};

let playerScore = 0;
let aiScore = 0;

function drawPaddle(paddle) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.font = '35px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(playerScore, canvas.width / 4, 50);
    ctx.fillText(aiScore, 3 * canvas.width / 4, 50);
}

function drawWorkInProgress() {
    ctx.font = '25px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Work is underway | psmurashov', canvas.width / 2, canvas.height / 2);
}

function movePaddle(paddle) {
    paddle.y += paddle.dy;
    if (paddle.y < 0) {
        paddle.y = 0;
    } else if (paddle.y + paddle.height > canvas.height) {
        paddle.y = canvas.height - paddle.height;
    }
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        resetBall();
    } else if (ball.x - ball.radius < 0) {
        aiScore++;
        resetBall();
    }

    if (ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height) {
        ball.dx = -ball.dx;
    }

    if (ball.x + ball.radius > aiPaddle.x &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.height) {
        ball.dx = -ball.dx;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = -ball.dx;
}

function aiMovement() {
    if (ball.y < aiPaddle.y + aiPaddle.height / 2) {
        aiPaddle.dy = -2;
    } else {
        aiPaddle.dy = 2;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
    drawBall();
    drawScore();
    drawWorkInProgress(); // Добавляем вызов функции для отображения текста
    movePaddle(playerPaddle);
    movePaddle(aiPaddle);
    moveBall();
    aiMovement();
    requestAnimationFrame(draw);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const root = document.documentElement;
    const mouseY = e.clientY - rect.top - root.scrollTop;
    playerPaddle.y = mouseY - playerPaddle.height / 2;
});

draw();

//====<
            }
        }

        // Вызываем функцию проверки при загрузке страницы
        checkUserAgent();