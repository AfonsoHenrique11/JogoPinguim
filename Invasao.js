let TILE = 32;
let LARGURA = 1024;                 
let ALTURA = 640;                   
let VELOCIDADE_JOGADOR = 140;       
let TAMANHO_JOGADOR = 20;           
let DIF_PADRAO = 0;                 // se não tiver o valor
let PREC_PADRAO = 100;              // se não tiver o valor
let COLUNAS_MAPA = 32;
let LINHAS_MIN = 9;
let LINHAS_MAX = 19;
let GUARDAS_E_CAMERAS = [2, 4, 6, 8];

//guardas e câmeras
let VELOCIDADE_GUARDA = 100;        
let VELOCIDADE_GIRO_GUARDA = 4;     
let ALCANCE_VISAO = 160;            
let ANGULO_VISAO = 60;              
let VARREDURA_CAMERA = 90;          
let CICLO_CAMERA = 4;               
let RAIOS_CONE = 40;                
let PASSO_RAIO = 2;                 

//Detecção
let TEMPO_DETECCAO_MAX = [8, 6, 4, 2.5];        
let TEMPO_DETECCAO_MIN = [2, 1.5, 1, 0.5];      
let ESVAZIAMENTO_BARRA = [0.5, 0.35, 0.2, 0.1]; 
let MULT_CAMERA = 1.5;                          

//Cofres
let DIGITOS_CODIGO = 4;
let TEMPO_CODIGO = 7;               
let ALCANCE_INTERACAO = 48;         

//Pontuação
let PONTUACAO_MAXIMA = 1000;                
let PESO_DISFARCE = 0.35;
let PESO_TEMPO = 0.65;
let TEMPO_EXTRA = [20, 25, 30, 35];         
let TEMPO_ZERO = [60, 120, 180, 240];       
let NICKNAME_MAX = 12;                      

// ---- Imagens ----
// Vazio = formas coloridas. Para usar imagens (sem mexer na lógica), preencha por nome, por exemplo
// jogador: 'imgs/arquivo.png'. Nomes: parede, chao, inicio, saida, cofre, cofre_aberto, jogador, guarda, camera
let IMAGENS_INVASAO = {};
let imagens = {};
for (let nome in IMAGENS_INVASAO) {
    let img = new Image();
    img.onload = () => { imagens[nome] = img; };
    img.src = IMAGENS_INVASAO[nome];
}

//Ler bagulhos do Afonso
let CHAVE_DIF = 'dificuldade';
let CHAVE_PREC = 'precisao';

function lerParametro(chave, padrao, ehValido) {
    let bruto = null;
    try {
        bruto = localStorage.getItem(chave);
    } catch (e) {
        console.warn('localStorage indisponível (' + e.name + ')');
    }
    if (bruto !== null && String(bruto).trim() !== '') {
        let valor = Number(bruto);
        if (ehValido(valor)) return valor;
        console.warn('Valor inválido em "' + chave + '": ' + bruto);
    }
    console.warn('"' + chave + '" não encontrado; usando padrão provisório: ' + padrao);
    return padrao;
}

let dificuldade = lerParametro(CHAVE_DIF, DIF_PADRAO, v => Number.isInteger(v) && v >= 0 && v <= 3);
let precisaoPct = lerParametro(CHAVE_PREC, PREC_PADRAO, v => Number.isFinite(v) && v >= 0 && v <= 100);
let precisao = precisaoPct / 100;

//Criador de mapas
function validarMapa(m, indice) {
    let erros = [];
    if (!m || !Array.isArray(m.grade) || m.grade.length === 0) return ['mapa sem grade'];
    let g = m.grade;
    let celula = (c, l) => (g[l] !== undefined ? g[l][c] : undefined);
    let dentro = (c, l) => celula(c, l) !== undefined;

    if (g.length < LINHAS_MIN || g.length > LINHAS_MAX) {
        erros.push('número de linhas fora de ' + LINHAS_MIN + ' a ' + LINHAS_MAX + ': ' + g.length);
    }
    g.forEach((l, i) => {
        if (l.length !== COLUNAS_MAPA) {
            erros.push('linha ' + i + ' tem ' + l.length + ' colunas (esperado ' + COLUNAS_MAPA + ')');
        }
    });

    let inicio = null;
    let saidas = [], cofres = [];
    g.forEach((l, lin) => {
        for (let col = 0; col < l.length; col++) {
            let c = l[col];
            if ('#.PES'.indexOf(c) === -1) erros.push('caractere inválido "' + c + '" em ' + col + ',' + lin);
            if (c === 'P') { if (inicio) erros.push('mais de um P'); inicio = [col, lin]; }
            if (c === 'E') saidas.push([col, lin]);
            if (c === 'S') cofres.push([col, lin]);
        }
    });
    if (!inicio) erros.push('falta o início (P)');
    if (saidas.length !== 1) erros.push('esperado exatamente 1 saída (E), encontrado ' + saidas.length);
    if (cofres.length === 0) erros.push('falta ao menos um cofre (S)');

    if (inicio) {
        let visto = new Set([inicio[0] + ',' + inicio[1]]);
        let fila = [inicio];
        while (fila.length) {
            let [c, l] = fila.shift();
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dl]) => {
                let nc = c + dc, nl = l + dl, k = nc + ',' + nl;
                if (dentro(nc, nl) && celula(nc, nl) !== '#' && !visto.has(k)) {
                    visto.add(k);
                    fila.push([nc, nl]);
                }
            });
        }
        saidas.forEach(([c, l]) => { if (!visto.has(c + ',' + l)) erros.push('saída inalcançável em ' + c + ',' + l); });
        cofres.forEach(([c, l]) => { if (!visto.has(c + ',' + l)) erros.push('cofre inalcançável em ' + c + ',' + l); });
    }

    let livre = (c, l) => Number.isInteger(c) && Number.isInteger(l) && dentro(c, l) && celula(c, l) !== '#';

    let guardas = m.guardas || [];
    if (guardas.length !== GUARDAS_E_CAMERAS[indice]) {
        erros.push('esperado ' + GUARDAS_E_CAMERAS[indice] + ' guardas, encontrado ' + guardas.length);
    }
    guardas.forEach((rota, i) => {
        if (!Array.isArray(rota) || rota.length < 2) { erros.push('guarda ' + i + ': rota precisa de ao menos 2 pontos'); return; }
        rota.forEach(([c, l], k) => {
            if (!livre(c, l)) erros.push('guarda ' + i + ': ponto ' + k + ' (' + c + ',' + l + ') fora do mapa ou em parede');
        });

        for (let k = 0; k < rota.length; k++) {
            let [c1, l1] = rota[k], [c2, l2] = rota[(k + 1) % rota.length];
            if (!livre(c1, l1) || !livre(c2, l2)) continue;
            let passos = Math.ceil(Math.hypot(c2 - c1, l2 - l1) * 4) + 1;
            for (let s = 0; s <= passos; s++) {
                let t = s / passos;
                if (!livre(Math.round(c1 + (c2 - c1) * t), Math.round(l1 + (l2 - l1) * t))) {
                    erros.push('guarda ' + i + ': trecho ' + k + ' (' + c1 + ',' + l1 + ' → ' + c2 + ',' + l2 + ') atravessa parede');
                    break;
                }
            }
        }
    });

    let cameras = m.cameras || [];
    if (cameras.length !== GUARDAS_E_CAMERAS[indice]) {
        erros.push('esperado ' + GUARDAS_E_CAMERAS[indice] + ' câmeras, encontrado ' + cameras.length);
    }
    cameras.forEach((cam, i) => {
        if (!livre(cam.col, cam.lin)) erros.push('câmera ' + i + ' (' + cam.col + ',' + cam.lin + ') fora do mapa ou em parede');
        if (typeof cam.direcao !== 'number' || !isFinite(cam.direcao)) erros.push('câmera ' + i + ': direção em graus ausente ou inválida');
    });

    return erros;
}

//Mapa
let mapa = MAPAS[dificuldade];
validarMapa(mapa, dificuldade).forEach(p => console.warn('Mapa "' + mapa.nome + '": ' + p));

let grade = mapa.grade.map(l => l.split(''));
let linhas = grade.length;
let colunas = grade[0].length;
let offsetY = (ALTURA - linhas * TILE) / 2;   //centraliza o mapa

let jogador = { x: 0, y: 0 };                 
let cofres = [];                              
let saida = null;                              
grade.forEach((l, lin) => l.forEach((c, col) => {
    if (c === 'P') {
        jogador.x = col * TILE + TILE / 2;
        jogador.y = lin * TILE + TILE / 2;
    }
    if (c === 'S') cofres.push({ col, lin, x: col * TILE + TILE / 2, y: lin * TILE + TILE / 2, aberto: false });
    if (c === 'E') saida = { col, lin };
}));

//Guardas e câmeras
let centroTile = (col, lin) => ({ x: col * TILE + TILE / 2, y: lin * TILE + TILE / 2 });

let guardas = mapa.guardas.map(rota => {
    let pontos = rota.map(([c, l]) => centroTile(c, l));
    let g = { pontos, x: pontos[0].x, y: pontos[0].y, alvo: 1, angulo: 0, cone: [] };
    g.angulo = Math.atan2(pontos[1].y - g.y, pontos[1].x - g.x);
    return g;
});

let cameras = mapa.cameras.map(c => {
    let p = centroTile(c.col, c.lin);
    let centro = c.direcao * Math.PI / 180;
    return { x: p.x, y: p.y, centro, angulo: centro, cone: [] };
});

let tempoJogo = 0;   
let deteccao = 0;   
let estadoJogo = 'jogando';   

let cofresAbertos = 0;
let temPendrive = false;        
let codigoAtual = '';           
let codigoVisivelAte = 0;       
let painelAberto = false;       // o jogo pausa com o painel abrido?
let cofreAtivo = null;
let digitado = '';
let pontuacaoFinal = 0;

function novoCodigo() {
    codigoAtual = String(Math.floor(Math.random() * Math.pow(10, DIGITOS_CODIGO))).padStart(DIGITOS_CODIGO, '0');
    codigoVisivelAte = tempoJogo + TEMPO_CODIGO;
}
novoCodigo();

// Tempo para a barra encher
let TEMPO_PARA_ENCHER = TEMPO_DETECCAO_MIN[dificuldade] +
    (TEMPO_DETECCAO_MAX[dificuldade] - TEMPO_DETECCAO_MIN[dificuldade]) * precisao * precisao;

function ehParede(col, lin) {
    if (col < 0 || lin < 0 || col >= colunas || lin >= linhas) return true;
    return grade[lin][col] === '#';
}

function colide(x, y) {
    let m = TAMANHO_JOGADOR / 2;
    let c0 = Math.floor((x - m) / TILE), c1 = Math.floor((x + m - 0.001) / TILE);
    let l0 = Math.floor((y - m) / TILE), l1 = Math.floor((y + m - 0.001) / TILE);
    for (let l = l0; l <= l1; l++) {
        for (let c = c0; c <= c1; c++) {
            if (ehParede(c, l)) return true;
        }
    }
    return false;
}

//Mexe o pinto
function mover(dx, dy) {
    if (dx && !colide(jogador.x + dx, jogador.y)) jogador.x += dx;
    if (dy && !colide(jogador.x, jogador.y + dy)) jogador.y += dy;
}

//Tecla pra movimento
let teclas = {};
window.addEventListener('keydown', aoPressionar);
window.addEventListener('keyup', e => { teclas[e.code] = false; });
window.addEventListener('blur', () => { for (let k in teclas) teclas[k] = false; });

//Telas
let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');

//Info pro jogador
let barraNivel = document.getElementById('barra-alerta-nivel');
let telaResultado = document.getElementById('tela-resultado');
let tituloResultado = document.getElementById('resultado-titulo');
let pontuacaoResultado = document.getElementById('resultado-pontuacao');
let hudTempo = document.getElementById('hud-tempo');
let hudCofres = document.getElementById('hud-cofres');
let hudPendrive = document.getElementById('hud-pendrive');
let hudCodigo = document.getElementById('hud-codigo');
let painelCofre = document.getElementById('painel-cofre');
let digitosPainel = painelCofre.querySelectorAll('#painel-digitos span');
let tempoResultado = document.getElementById('resultado-tempo');
let grupoRanking = document.getElementById('grupo-ranking');
let campoNickname = document.getElementById('campo-nickname');
let botaoRanking = document.getElementById('botao-ranking');
document.getElementById('botao-jogar-de-novo').addEventListener('click', () => {
    location.href = 'principal.html';
});
campoNickname.addEventListener('input', () => { botaoRanking.disabled = !nickValido(campoNickname.value); });
campoNickname.addEventListener('keydown', e => { if (e.key === 'Enter') irParaRanking(); });
botaoRanking.addEventListener('click', irParaRanking);

function normalizarAngulo(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

function paredeEmPx(px, py) {
    return ehParede(Math.floor(px / TILE), Math.floor(py / TILE));
}

//Pros cara nao ter xray
function calcularCone(x, y, angulo) {
    let pontos = [{ x, y }];
    let meio = (ANGULO_VISAO * Math.PI / 180) / 2;
    for (let i = 0; i <= RAIOS_CONE; i++) {
        let a = angulo - meio + (2 * meio) * i / RAIOS_CONE;
        let dx = Math.cos(a), dy = Math.sin(a);
        let d = 0;
        while (d + PASSO_RAIO <= ALCANCE_VISAO && !paredeEmPx(x + dx * (d + PASSO_RAIO), y + dy * (d + PASSO_RAIO))) {
            d += PASSO_RAIO;
        }
        pontos.push({ x: x + dx * d, y: y + dy * d });
    }
    return pontos;
}

function atualizarGuarda(g, dt) {
    let alvo = g.pontos[g.alvo];
    let dx = alvo.x - g.x, dy = alvo.y - g.y;
    let dist = Math.hypot(dx, dy);
    let passo = VELOCIDADE_GUARDA * dt;
    if (dist <= passo) {
        g.x = alvo.x;
        g.y = alvo.y;
        g.alvo = (g.alvo + 1) % g.pontos.length;
    } else {
        g.x += dx / dist * passo;
        g.y += dy / dist * passo;
    }
    //gira
    let prox = g.pontos[g.alvo];
    let desejado = Math.atan2(prox.y - g.y, prox.x - g.x);
    let diff = normalizarAngulo(desejado - g.angulo);
    let maxGiro = VELOCIDADE_GIRO_GUARDA * dt;
    g.angulo = normalizarAngulo(g.angulo + Math.max(-maxGiro, Math.min(maxGiro, diff)));
    g.cone = calcularCone(g.x, g.y, g.angulo);
}

function atualizarCamera(c) {
    let amplitude = (VARREDURA_CAMERA * Math.PI / 180) / 2;
    c.angulo = c.centro + amplitude * Math.sin(2 * Math.PI * tempoJogo / CICLO_CAMERA);
    c.cone = calcularCone(c.x, c.y, c.angulo);
}

function calcularPontuacao(tempo) {
    let extra = TEMPO_EXTRA[dificuldade], zero = TEMPO_ZERO[dificuldade];
    let fatorTempo = Math.max(0, Math.min(1, 1 - (tempo - extra) / (zero - extra)));
    return Math.round(PONTUACAO_MAXIMA * (PESO_DISFARCE * precisao + PESO_TEMPO * fatorTempo));
}

function nickValido(texto) {
    let n = texto.trim();
    return n.length >= 1 && n.length <= NICKNAME_MAX;
}

let CHAVE_PARTIDA = 'pinguinsEspioes.partida';
function irParaRanking() {
    let nick = campoNickname.value.trim();
    if (estadoJogo !== 'venceu' || !nickValido(nick)) return;
    try {
        localStorage.setItem(CHAVE_PARTIDA, JSON.stringify({ nick, pontos: pontuacaoFinal, dif: dificuldade }));
    } catch (e) {
        console.warn('Não foi possível gravar a partida para o ranking (' + e.name + ')');
    }
    location.href = 'ranking.html';
}

function formatarTempo(seg) {
    let t = Math.floor(seg);
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

//Resultado
function encerrar(resultado) {
    estadoJogo = resultado;
    painelAberto = false;
    painelCofre.classList.add('hidden');
    let venceu = resultado === 'venceu';
    pontuacaoFinal = venceu ? calcularPontuacao(tempoJogo) : 0;
    tituloResultado.textContent = venceu ? 'Missão cumprida' : 'Missão falhou';
    pontuacaoResultado.textContent = 'Pontuação: ' + pontuacaoFinal;
    tempoResultado.textContent = 'Tempo: ' + formatarTempo(tempoJogo);
    tempoResultado.classList.toggle('hidden', !venceu);
    grupoRanking.classList.toggle('hidden', !venceu);
    botaoRanking.classList.toggle('hidden', !venceu);
    botaoRanking.disabled = !nickValido(campoNickname.value);
    telaResultado.classList.remove('hidden');
    if (venceu) campoNickname.focus();
}

//Painel cofre
function atualizarPainel() {
    digitosPainel.forEach((el, i) => { el.textContent = digitado[i] || ''; });
}

function abrirPainel(cofre) {
    cofreAtivo = cofre;
    digitado = '';
    painelAberto = true;
    painelCofre.classList.remove('hidden');
    atualizarPainel();
}

function fecharPainel() {
    painelAberto = false;
    cofreAtivo = null;
    digitado = '';
    painelCofre.classList.add('hidden');
}

function cofreAoAlcance() {
    let melhor = null, melhorDist = ALCANCE_INTERACAO;
    cofres.forEach(c => {
        if (c.aberto) return;
        let d = Math.hypot(c.x - jogador.x, c.y - jogador.y);
        if (d <= melhorDist) { melhor = c; melhorDist = d; }
    });
    return melhor;
}

function tentarAbrirPainel() {
    let cofre = cofreAoAlcance();
    if (cofre) abrirPainel(cofre);
}

function confirmarCodigo() {
    if (digitado !== codigoAtual) {
        digitado = '';
        return;
    }
    cofreAtivo.aberto = true;
    cofresAbertos++;
    fecharPainel();
    if (cofresAbertos === cofres.length) {
        temPendrive = true;
        codigoAtual = '';
        hudPendrive.classList.remove('hidden');
    } else {
        novoCodigo();
    }
}

function aoPressionar(e) {
    teclas[e.code] = true;
    if (estadoJogo !== 'jogando') return;
    if (e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat && e.code !== 'Backspace') return;
    if (painelAberto) {
        if (e.key.length === 1 && e.key >= '0' && e.key <= '9') {
            if (digitado.length < DIGITOS_CODIGO) digitado += e.key;
        } else if (e.code === 'Backspace') {
            digitado = digitado.slice(0, -1);
        } else if (e.code === 'KeyL') {
            confirmarCodigo();
        } else if (e.code === 'Escape') {
            fecharPainel();
        }
        if (painelAberto) atualizarPainel();
        return;
    }
    if (e.code === 'KeyL') tentarAbrirPainel();
}

function atualizarMissao() {
    if (estadoJogo !== 'jogando') return;
    hudTempo.textContent = 'Tempo: ' + formatarTempo(tempoJogo);
    hudCofres.textContent = 'Cofres: ' + cofresAbertos + '/' + cofres.length;
    let mostrarCodigo = codigoAtual !== '' && tempoJogo < codigoVisivelAte;
    hudCodigo.classList.toggle('hidden', !mostrarCodigo);
    if (mostrarCodigo) hudCodigo.textContent = 'Código: ' + codigoAtual;

    if (temPendrive && saida &&
        Math.floor(jogador.x / TILE) === saida.col && Math.floor(jogador.y / TILE) === saida.lin) {
        encerrar('venceu');
    }
}

function pontoNoPoligono(px, py, poly) {
    let dentro = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
}

function atualizarDeteccao(dt) {
    let taxa = 0;
    guardas.forEach(g => {
        if (pontoNoPoligono(jogador.x, jogador.y, g.cone)) taxa = Math.max(taxa, 1 / TEMPO_PARA_ENCHER);
    });
    cameras.forEach(c => {
        if (pontoNoPoligono(jogador.x, jogador.y, c.cone)) taxa = Math.max(taxa, MULT_CAMERA / TEMPO_PARA_ENCHER);
    });

    if (taxa > 0) deteccao += taxa * dt;
    else deteccao -= ESVAZIAMENTO_BARRA[dificuldade] * dt;
    deteccao = Math.max(0, Math.min(1, deteccao));

    barraNivel.style.width = (deteccao * 100) + '%';
    barraNivel.style.backgroundColor = 'hsl(' + Math.round(200 * (1 - deteccao)) + ', 85%, 55%)';

    if (deteccao >= 1) encerrar('falhou');
}

function atualizar(dt) {
    if (estadoJogo !== 'jogando') return;
    let direita = teclas.KeyD || teclas.ArrowRight;
    let esquerda = teclas.KeyA || teclas.ArrowLeft;
    let baixo = teclas.KeyS || teclas.ArrowDown;
    let cima = teclas.KeyW || teclas.ArrowUp;
    let dx = (direita ? 1 : 0) - (esquerda ? 1 : 0);
    let dy = (baixo ? 1 : 0) - (cima ? 1 : 0);
    if (painelAberto) { dx = 0; dy = 0; }
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    mover(dx * VELOCIDADE_JOGADOR * dt, dy * VELOCIDADE_JOGADOR * dt);

    tempoJogo += dt;
    guardas.forEach(g => atualizarGuarda(g, dt));
    cameras.forEach(atualizarCamera);
    atualizarDeteccao(dt);
    atualizarMissao();
}

function desenhar(nome, x, y, w, h, cor) {
    let img = imagens[nome];
    if (img) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = cor;
        ctx.fillRect(x, y, w, h);
    }
}

function renderizar() {
    ctx.clearRect(0, 0, LARGURA, ALTURA);

    for (let lin = 0; lin < linhas; lin++) {
        for (let col = 0; col < colunas; col++) {
            let c = grade[lin][col];
            let x = col * TILE, y = offsetY + lin * TILE;
            if (c === '#') {
                desenhar('parede', x, y, TILE, TILE, '#475569');
            } else {
                desenhar('chao', x, y, TILE, TILE, '#0f172a');
                if (c === 'P') desenhar('inicio', x, y, TILE, TILE, '#0369a1');
                if (c === 'E') desenhar('saida', x, y, TILE, TILE, '#22c55e');
                if (c === 'S') {
                    let aberto = cofres.some(cf => cf.col === col && cf.lin === lin && cf.aberto);
                    desenhar(aberto ? 'cofre_aberto' : 'cofre', x, y, TILE, TILE, aberto ? '#78350f' : '#f59e0b');
                }
            }
        }
    }

    function desenharCone(cone, cor) {
        if (cone.length < 3) return;
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.moveTo(cone[0].x, offsetY + cone[0].y);
        for (let i = 1; i < cone.length; i++) ctx.lineTo(cone[i].x, offsetY + cone[i].y);
        ctx.closePath();
        ctx.fill();
    }
    guardas.forEach(g => desenharCone(g.cone, 'rgba(239, 68, 68, 0.25)'));
    cameras.forEach(c => desenharCone(c.cone, 'rgba(249, 115, 22, 0.25)'));

    guardas.forEach(g => desenhar('guarda', g.x - 10, offsetY + g.y - 10, 20, 20, '#ef4444'));
    cameras.forEach(c => {
        desenhar('camera', c.x - 8, offsetY + c.y - 8, 16, 16, '#f97316');
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(c.x, offsetY + c.y);
        ctx.lineTo(c.x + Math.cos(c.angulo) * 24, offsetY + c.y + Math.sin(c.angulo) * 24);
        ctx.stroke();
    });

    desenhar('jogador',
        jogador.x - TAMANHO_JOGADOR / 2,
        offsetY + jogador.y - TAMANHO_JOGADOR / 2,
        TAMANHO_JOGADOR, TAMANHO_JOGADOR, '#ffffff');

    desenharIndicadorInteracao();
}

function desenharIndicadorInteracao() {
    if (estadoJogo !== 'jogando' || painelAberto) return;
    let cofre = cofreAoAlcance();
    if (!cofre) return;
    let lado = 22;
    let x = cofre.x - lado / 2;
    let y = offsetY + cofre.y - TILE / 2 - lado - 6;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, lado, lado, 6); else ctx.rect(x, y, lado, lado);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', cofre.x, y + lado / 2 + 1);
    ctx.restore();
}

//Loop
let ultimo = performance.now();
function loop(agora) {
    let dt = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    atualizar(dt);
    renderizar();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);