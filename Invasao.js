let canvas, ctx;
let gameLoop;
let player = { x: 200, y: 450, radius: 12, speed: 4 };
let WASD = {};
let suspeita = 0;
let disfarce = 66;
let lasers = [];

function iniciarInvasao() {
    disfarce = parseInt(document.getElementById('select-dificuldade').value);
    
    document.getElementById('tela-dificuldade').classList.add('hidden');
    document.getElementById('tela-jogo').classList.remove('hidden');

    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    player.x = canvas.width / 2;
    player.y = canvas.height - 40;
    suspeita = 0;

    // edita leise
    lasers = [
        { y: 150, x: 50, speed: 2 + (100 - disfarce) * 0.02, width: 80, dir: 1 },
        { y: 250, x: 200, speed: 2.5 + (100 - disfarce) * 0.02, width: 100, dir: -1 },
        { y: 350, x: 100, speed: 3 + (100 - disfarce) * 0.02, width: 70, dir: 1 }
    ];

    loop();
}

window.addEventListener('keydown', e => WASD[e.key] = true);
window.addEventListener('keyup', e => WASD[e.key] = false);

function update() {
    if ((WASD['ArrowLeft'] || WASD['a']) && player.x - player.radius > 0) player.x -= player.speed;
    if ((WASD['ArrowRight'] || WASD['d']) && player.x + player.radius < canvas.width) player.x += player.speed;
    if ((WASD['ArrowUp'] || WASD['w']) && player.y - player.radius > 0) player.y -= player.speed;
    if ((WASD['ArrowDown'] || WASD['s']) && player.y + player.radius < canvas.height) player.y += player.speed;

    if (player.y < 30) {
        alert("Missão Cumprida! Cofre hackeado com sucesso!");
        location.reload();
        return;
    }

    // Méxi nos leise
    lasers.forEach(l => {
        l.x += l.speed * l.dir;
        if (l.x <= 0 || l.x + l.width >= canvas.width) l.dir *= -1;

        if (Math.abs(player.y - l.y) < player.radius && player.x > l.x && player.x < l.x + l.width) {
            suspeita += 200 / disfarce;
        }
    });

    suspeita = Math.max(0, suspeita - 0.05);
    document.getElementById('texto-alerta').innerText = Math.floor(suspeita) + '%';

    if (suspeita >= 100) {
        alert("Agente capturado.");
        location.reload();
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Zona do Cofre
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, canvas.width, 30);

    // Lasers
    ctx.fillStyle = '#ff0055';
    lasers.forEach(l => {
        ctx.fillRect(l.x, l.y - 2, l.width, 4);
    });

    // Pinguim
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
}

function loop() {
    update();
    render();
    gameLoop = requestAnimationFrame(loop);
}