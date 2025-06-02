// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置canvas尺寸为窗口大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // 玩家位置保持在底部中央
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
}
window.addEventListener('resize', resizeCanvas);

// 在文件开头添加图片对象
const playerImage = new Image();
playerImage.src = 'resources/images/player_image.PNG';

const enemyImage = new Image();
enemyImage.src = 'resources/images/enemy_image.PNG';

const enemyImage2 = new Image();
enemyImage2.src = 'resources/images/enemy_image2.JPG';

// 获取DOM元素
const startScreen = document.getElementById('startScreen');
const shopScreen = document.getElementById('shopScreen');
const settingsScreen = document.getElementById('settingsScreen');
const startBtn = document.getElementById('startBtn');
const shopBtn = document.getElementById('shopBtn');
const settingsBtn = document.getElementById('settingsBtn');
const shopBackBtn = document.getElementById('shopBackBtn');
const settingsBackBtn = document.getElementById('settingsBackBtn');

// 游戏是否已开始
let gameStarted = false;

// 界面切换逻辑
function showScreen(screenToShow) {
    [startScreen, shopScreen, settingsScreen].forEach(screen => {
        if(screen) screen.style.display = 'none';
    });
    if(screenToShow) screenToShow.style.display = 'flex';
}

// 按钮事件
startBtn.onclick = function() {
    showScreen(null);  // 隐藏所有界面
    gameStarted = true;
    if (imagesLoaded === 2) {
        startGame();
    }
};

shopBtn.onclick = function() {
    showScreen(shopScreen);
};

settingsBtn.onclick = function() {
    showScreen(settingsScreen);
};

shopBackBtn.onclick = function() {
    showScreen(startScreen);
};

settingsBackBtn.onclick = function() {
    showScreen(startScreen);
};

// 图片加载检测
let imagesLoaded = 0;
playerImage.onload = function() {
    imagesLoaded++;
    tryStartGame();
};
enemyImage.onload = function() {
    imagesLoaded++;
    tryStartGame();
};

function tryStartGame() {
    if (imagesLoaded === 2 && gameStarted) {
        startGame();
    }
}

function startGame() {
    resizeCanvas();
    setInterval(autoFire, 200);
    setInterval(() => { if (Math.random() < 0.5) createEnemy(); }, 250);
    setInterval(() => {
        score += 1;
        updateScore();
    }, 1000);
    gameLoop();
}

// 玩家对象
const player = {
    x: 0, // 初始化后会被resizeCanvas覆盖
    y: 0,
    width: 60,
    height: 60,
    speed: 5,
    bullets: []
};

// 子弹方向（单位向量），默认向上
let bulletDir = { x: 0, y: -1 };

// 敌人数组
let enemies = [];
let enemyBullets = [];

let keys = {};

// Gamepad（手柄）支持
let gamepadIndex = null;
let gamepadConnected = false;
let gamepadRetryCount = 0;
const MAX_GAMEPAD_RETRIES = 3;

// 检查手柄连接状态
function checkGamepad() {
    if (gamepadIndex !== null) {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[gamepadIndex];
        if (!gamepad && gamepadRetryCount < MAX_GAMEPAD_RETRIES) {
            console.log('Gamepad disconnected, retrying...');
            gamepadRetryCount++;
            setTimeout(checkGamepad, 500);
        } else if (gamepad) {
            gamepadConnected = true;
            gamepadRetryCount = 0;
            console.log('Gamepad connected successfully');
        } else {
            console.log('Failed to connect gamepad after retries');
            gamepadIndex = null;
            gamepadConnected = false;
        }
    }
}

window.addEventListener("gamepadconnected", function(e) {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadIndex = e.gamepad.index;
    gamepadRetryCount = 0;
    checkGamepad();
});

window.addEventListener("gamepaddisconnected", function(e) {
    if (gamepadIndex === e.gamepad.index) {
        console.log('Gamepad disconnected:', e.gamepad.id);
        gamepadIndex = null;
        gamepadConnected = false;
    }
});

// 分数
let score = 0;

// 游戏数据
let gameData = {
    coins: 0,
    highScore: 0
};

// 加载游戏数据
async function loadGameData() {
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch('http://localhost:8000/data/data.json');
            if (response.ok) {
                gameData = await response.json();
                updateCoinsDisplay();
                return;
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
        }
        retries--;
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    // 如果无法加载，使用默认值
    gameData = { coins: 0, highScore: 0 };
    updateCoinsDisplay();
}

// 保存游戏数据
async function saveGameData() {
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch('http://localhost:8000/data/data.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData)
            });
            if (response.ok) {
                return;
            }
        } catch (error) {
            console.error('Error saving game data:', error);
        }
        retries--;
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// 更新金币显示
function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('coinsDisplay');
    if (coinsDisplay) {
        coinsDisplay.textContent = `金币: ${gameData.coins}`;
    }
}

// 计算和添加新获得的金币
function addNewCoins(score) {
    const newCoins = Math.ceil(score / 10);
    gameData.coins += newCoins;
    if (score > gameData.highScore) {
        gameData.highScore = score;
    }
    saveGameData();
    return newCoins;
}

// 加载初始数据
loadGameData();

// 监听键盘
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // 方向键控制子弹方向
    if (e.code === 'ArrowUp') {
        bulletDir = { x: 0, y: -1 };
    } else if (e.code === 'ArrowDown') {
        bulletDir = { x: 0, y: 1 };
    } else if (e.code === 'ArrowLeft') {
        bulletDir = { x: -1, y: 0 };
    } else if (e.code === 'ArrowRight') {
        bulletDir = { x: 1, y: 0 };
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// 绘制玩家
function drawPlayer() {
    ctx.drawImage(playerImage, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = 'purple';
    player.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'red';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// 移动玩家
function movePlayer() {
    // WASD控制
    if (keys['KeyW'] && player.y - player.height / 2 > 0) player.y -= player.speed;
    if (keys['KeyS'] && player.y + player.height / 2 < canvas.height) player.y += player.speed;
    if (keys['KeyA'] && player.x - player.width / 2 > 0) player.x -= player.speed;
    if (keys['KeyD'] && player.x + player.width / 2 < canvas.width) player.x += player.speed;

    // 处理手柄输入
    handleGamepadInput();
}

// 处理手柄输入
function handleGamepadInput() {
    if (!gamepadConnected || gamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];

    if (!gp) {
        checkGamepad();
        return;
    }

    // PS5左摇杆 axes[0] (左右), axes[1] (上下)
    let dx = gp.axes[0];
    let dy = gp.axes[1];

    // 死区处理
    if (Math.abs(dx) < 0.15) dx = 0;
    if (Math.abs(dy) < 0.15) dy = 0;

    // 调整速度
    player.x += dx * player.speed * 2;
    player.y += dy * player.speed * 2;

    // 边界限制
    if (player.x - player.width / 2 < 0) player.x = player.width / 2;
    if (player.x + player.width / 2 > canvas.width) player.x = canvas.width - player.width / 2;
    if (player.y - player.height / 2 < 0) player.y = player.height / 2;
    if (player.y + player.height / 2 > canvas.height) player.y = canvas.height - player.height / 2;

    // 右摇杆控制子弹方向
    let rx = gp.axes[2];
    let ry = gp.axes[3];

    // 死区处理
    if (Math.abs(rx) > 0.2 || Math.abs(ry) > 0.2) {
        // 归一化方向
        let len = Math.sqrt(rx * rx + ry * ry);
        if (len > 0) {
            bulletDir.x = rx / len;
            bulletDir.y = ry / len;
        }
    }
}

// 移动子弹
function moveBullets() {
    player.bullets.forEach((bullet, index) => {
        // 如果有方向则用方向，否则默认向上
        if (bullet.dx !== undefined && bullet.dy !== undefined) {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
        } else {
            bullet.y -= 10;
        }
        if (
            bullet.y < 0 ||
            bullet.y > canvas.height ||
            bullet.x < 0 ||
            bullet.x > canvas.width
        ) {
            player.bullets.splice(index, 1);
        }
    });

    enemyBullets.forEach((bullet, index) => {
        // 使用方向分量移动
        if (bullet.dx !== undefined && bullet.dy !== undefined) {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
        } else {
            bullet.y += 4;
        }
        if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0) {
            enemyBullets.splice(index, 1);
        }
    });
}

// 移动敌人
function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += 2;
        if (Math.random() < 0.01) {
            // 计算朝向玩家的方向
            const px = player.x;
            const py = player.y;
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height;
            const dx = px - ex;
            const dy = py - ey;
            const len = Math.sqrt(dx * dx + dy * dy);
            const speed = 4;
            let vx = 0, vy = speed;
            if (len !== 0) {
                vx = dx / len * speed;
                vy = dy / len * speed;
            }
            enemyBullets.push({ x: ex, y: ey, dx: vx, dy: vy });
        }
        if (enemy.y > canvas.height) enemies.splice(index, 1);
    });
}

// 创建敌人
function createEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 60),
        y: -40,
        width: 60,
        height: 60
    };
    enemies.push(enemy);
}

// 自动发射玩家子弹
function autoFire() {
    // 子弹速度
    const speed = 10;
    player.bullets.push({
        x: player.x, // 玩家中心坐标
        y: player.y,
        dx: bulletDir.x * speed,
        dy: bulletDir.y * speed
    });
}

// 碰撞检测
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + (a.width || 10) > b.x &&
        a.y < b.y + (b.height || 10) &&
        a.y + (a.height || 10) > b.y
    );
}

// 更新分数
function updateScore() {
    document.getElementById('score').innerText = `分数: ${score}`;
}

// 游戏结束
function gameOver() {
    const newCoins = addNewCoins(score);
    alert(`游戏结束！\n最终分数: ${score}\n获得金币: ${newCoins}\n当前总金币: ${gameData.coins}`);
    document.location.reload();
}

// 游戏主循环
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    moveBullets();
    moveEnemies();

    // 绘制
    drawPlayer();
    drawBullets();
    drawEnemies();

    // 碰撞检测（玩家子弹击中敌机）
    player.bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isColliding({x: bullet.x-5, y: bullet.y-5, width:10, height:10}, enemy)) {
                player.bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                score += 10;
                updateScore();
            }
        });
    });

    // 敌机子弹击中玩家
    enemyBullets.forEach((bullet, index) => {
        if (isColliding({x: bullet.x-5, y: bullet.y-5, width:10, height:10}, {x:player.x-30, y:player.y-30, width:60, height:60})) {
            gameOver();
        }
    });

    // 敌机碰到玩家
    enemies.forEach(enemy => {
        if (isColliding(enemy, {x:player.x-30, y:player.y-30, width:60, height:60})) {
            gameOver();
        }
    });

    requestAnimationFrame(gameLoop);
}
