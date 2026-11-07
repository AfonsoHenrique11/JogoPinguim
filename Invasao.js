// ===== Invasao.js — Etapa 5 (cofres, pendrive e saída) =====
// Depende de InvasaoMapas.js (carregado antes no HTML).

// ---- Constantes ----
const TILE = 32;
const LARGURA = 1024;                 // provisório (aprovado por enquanto)
const ALTURA = 640;                   // provisório (aprovado por enquanto)
const VELOCIDADE_JOGADOR = 140;       // px/s — provisório
const TAMANHO_JOGADOR = 20;           // px — provisório
const DIF_PADRAO = 1;                 // provisório: usado só se a URL não trouxer "dif"
const PREC_PADRAO = 100;              // provisório: usado só se a URL não trouxer "prec"
const NOMES_DIFICULDADE = ['Fácil', 'Normal', 'Difícil', 'Impossível'];
const COLUNAS_MAPA = 32;
const LINHAS_MIN = 9;
const LINHAS_MAX = 19;
const GUARDAS_E_CAMERAS = [2, 4, 6, 8];   // por dificuldade (mesma quantidade de guardas e de câmeras)

// ---- Vigias (guardas e câmeras) ----
const VELOCIDADE_GUARDA = 100;        // px/s — definido (igual em todas as dificuldades)
const VELOCIDADE_GIRO_GUARDA = 4;     // rad/s — provisório (giro suave do guarda ao mudar de rumo)
const ALCANCE_VISAO = 160;            // px — provisório (guardas e câmeras)
const ANGULO_VISAO = 60;              // graus — provisório (abertura total do cone)
const VARREDURA_CAMERA = 90;          // graus — provisório (45° para cada lado da direção central)
const CICLO_CAMERA = 4;               // s — provisório (ida e volta completa)
const RAIOS_CONE = 40;                // provisório: raios por cone (precisão do corte pelas paredes)
const PASSO_RAIO = 2;                 // px — provisório: passo de cada raio

// ---- Detecção (valores por dificuldade, índice 0 a 3) ----
const TEMPO_DETECCAO_MAX = [8, 6, 4, 2.5];        // s — disfarce perfeito (definido)
const TEMPO_DETECCAO_MIN = [2, 1.5, 1, 0.5];      // s — disfarce péssimo (definido)
const ESVAZIAMENTO_BARRA = [0.5, 0.35, 0.2, 0.1]; // fração/s — provisório
const MULT_CAMERA = 1.5;                          // provisório: câmeras detectam 1,5x mais rápido

// ---- Cofres ----
const DIGITOS_CODIGO = 4;             // definido
const TEMPO_CODIGO = 7;               // s — definido (código visível, sem pausar o jogo)
const ALCANCE_INTERACAO = 48;         // px — provisório: distância máxima do centro do cofre para usar L

// ---- Imagens (placeholders) ----
// Vazio = tudo desenhado com formas coloridas. Para trocar por imagem, sem mexer na lógica:
// IMAGENS_INVASAO.jogador = 'imgs/arquivo.png'
// Nomes usados: parede, chao, inicio, saida, cofre, cofre_aberto, jogador, guarda, camera
const IMAGENS_INVASAO = {};
const imagens = {};
for (const nome in IMAGENS_INVASAO) {
    const img = new Image();
    img.onload = () => { imagens[nome] = img; };
    img.src = IMAGENS_INVASAO[nome];
}

// ---- Parâmetros vindos da URL (ex.: Invasao.html?dif=2&prec=85) ----
function lerNumero(p, nome, padrao, ehValido) {
    const bruto = p.get(nome);
    const valor = Number(bruto);
    if (bruto === null || bruto.trim() === '' || !ehValido(valor)) {
        console.warn('Parâmetro "' + nome + '" ausente ou inválido; usando padrão provisório: ' + padrao);
        return padrao;
    }
    return valor;
}
const params = new URLSearchParams(location.search);
const dificuldade = lerNumero(params, 'dif', DIF_PADRAO, v => Number.isInteger(v) && v >= 0 && v <= 3);
const precisaoPct = lerNumero(params, 'prec', PREC_PADRAO, v => Number.isFinite(v) && v >= 0 && v <= 100);
const precisao = precisaoPct / 100;   // 0 a 1, usado nas fórmulas das próximas etapas

// ---- Validador de mapas (só avisa no console; não corrige nada) ----
function validarMapa(m, indice) {
    const erros = [];
    if (!m || !Array.isArray(m.grade) || m.grade.length === 0) return ['mapa sem grade'];
    const g = m.grade;
    const celula = (c, l) => (g[l] !== undefined ? g[l][c] : undefined);
    const dentro = (c, l) => celula(c, l) !== undefined;

    if (g.length < LINHAS_MIN || g.length > LINHAS_MAX) {
        erros.push('número de linhas fora de ' + LINHAS_MIN + ' a ' + LINHAS_MAX + ': ' + g.length);
    }
    g.forEach((l, i) => {
        if (l.length !== COLUNAS_MAPA) {
            erros.push('linha ' + i + ' tem ' + l.length + ' colunas (esperado ' + COLUNAS_MAPA + ')');
        }
    });

    let inicio = null;
    const saidas = [], cofres = [];
    g.forEach((l, lin) => {
        for (let col = 0; col < l.length; col++) {
            const c = l[col];
            if ('#.PES'.indexOf(c) === -1) erros.push('caractere inválido "' + c + '" em ' + col + ',' + lin);
            if (c === 'P') { if (inicio) erros.push('mais de um P'); inicio = [col, lin]; }
            if (c === 'E') saidas.push([col, lin]);
            if (c === 'S') cofres.push([col, lin]);
        }
    });
    if (!inicio) erros.push('falta o início (P)');
    if (saidas.length !== 1) erros.push('esperado exatamente 1 saída (E), encontrado ' + saidas.length);
    if (cofres.length === 0) erros.push('falta ao menos um cofre (S)');

    // Alcançabilidade a partir do início
    if (inicio) {
        const visto = new Set([inicio[0] + ',' + inicio[1]]);
        const fila = [inicio];
        while (fila.length) {
            const [c, l] = fila.shift();
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dl]) => {
                const nc = c + dc, nl = l + dl, k = nc + ',' + nl;
                if (dentro(nc, nl) && celula(nc, nl) !== '#' && !visto.has(k)) {
                    visto.add(k);
                    fila.push([nc, nl]);
                }
            });
        }
        saidas.forEach(([c, l]) => { if (!visto.has(c + ',' + l)) erros.push('saída inalcançável em ' + c + ',' + l); });
        cofres.forEach(([c, l]) => { if (!visto.has(c + ',' + l)) erros.push('cofre inalcançável em ' + c + ',' + l); });
    }

    const livre = (c, l) => Number.isInteger(c) && Number.isInteger(l) && dentro(c, l) && celula(c, l) !== '#';

    // Guardas
    const guardas = m.guardas || [];
    if (guardas.length !== GUARDAS_E_CAMERAS[indice]) {
        erros.push('esperado ' + GUARDAS_E_CAMERAS[indice] + ' guardas, encontrado ' + guardas.length);
    }
    guardas.forEach((rota, i) => {
        if (!Array.isArray(rota) || rota.length < 2) { erros.push('guarda ' + i + ': rota precisa de ao menos 2 pontos'); return; }
        rota.forEach(([c, l], k) => {
            if (!livre(c, l)) erros.push('guarda ' + i + ': ponto ' + k + ' (' + c + ',' + l + ') fora do mapa ou em parede');
        });
        // Rota em linha reta entre pontos consecutivos (e do último ao primeiro) não deve atravessar paredes
        for (let k = 0; k < rota.length; k++) {
            const [c1, l1] = rota[k], [c2, l2] = rota[(k + 1) % rota.length];
            if (!livre(c1, l1) || !livre(c2, l2)) continue;
            const passos = Math.ceil(Math.hypot(c2 - c1, l2 - l1) * 4) + 1;
            for (let s = 0; s <= passos; s++) {
                const t = s / passos;
                if (!livre(Math.round(c1 + (c2 - c1) * t), Math.round(l1 + (l2 - l1) * t))) {
                    erros.push('guarda ' + i + ': trecho ' + k + ' (' + c1 + ',' + l1 + ' → ' + c2 + ',' + l2 + ') atravessa parede');
                    break;
                }
            }
        }
    });

    // Câmeras
    const cameras = m.cameras || [];
    if (cameras.length !== GUARDAS_E_CAMERAS[indice]) {
        erros.push('esperado ' + GUARDAS_E_CAMERAS[indice] + ' câmeras, encontrado ' + cameras.length);
    }
    cameras.forEach((cam, i) => {
        if (!livre(cam.col, cam.lin)) erros.push('câmera ' + i + ' (' + cam.col + ',' + cam.lin + ') fora do mapa ou em parede');
        if (typeof cam.direcao !== 'number' || !isFinite(cam.direcao)) erros.push('câmera ' + i + ': direção em graus ausente ou inválida');
    });

    return erros;
}

// ---- Escolha e carregamento do mapa ----
let indiceMapa = dificuldade;
let avisoFallback = '';
if (!MAPAS[indiceMapa]) {
    console.warn('Mapa da dificuldade ' + NOMES_DIFICULDADE[dificuldade] + ' ainda não existe; usando o Fácil (provisório).');
    indiceMapa = 0;
    avisoFallback = ' (provisório: mapa Fácil)';
}
const mapa = MAPAS[indiceMapa];
const problemas = validarMapa(mapa, indiceMapa);
problemas.forEach(p => console.warn('Mapa "' + mapa.nome + '": ' + p));

const grade = mapa.grade.map(l => l.split(''));
const linhas = grade.length;
const colunas = grade[0].length;
const offsetY = (ALTURA - linhas * TILE) / 2;   // centraliza o mapa verticalmente no canvas

const jogador = { x: 0, y: 0 };                 // centro, em coordenadas do mapa (px)
const cofres = [];                              // { col, lin, x, y, aberto }
let saida = null;                               // { col, lin }
grade.forEach((l, lin) => l.forEach((c, col) => {
    if (c === 'P') {
        jogador.x = col * TILE + TILE / 2;
        jogador.y = lin * TILE + TILE / 2;
    }
    if (c === 'S') cofres.push({ col, lin, x: col * TILE + TILE / 2, y: lin * TILE + TILE / 2, aberto: false });
    if (c === 'E') saida = { col, lin };
}));

// ---- Guardas e câmeras (estado em coordenadas do mapa, px) ----
const centroTile = (col, lin) => ({ x: col * TILE + TILE / 2, y: lin * TILE + TILE / 2 });

const guardas = mapa.guardas.map(rota => {
    const pontos = rota.map(([c, l]) => centroTile(c, l));
    const g = { pontos, x: pontos[0].x, y: pontos[0].y, alvo: 1, angulo: 0, cone: [] };
    g.angulo = Math.atan2(pontos[1].y - g.y, pontos[1].x - g.x);
    return g;
});

const cameras = mapa.cameras.map(c => {
    const p = centroTile(c.col, c.lin);
    const centro = c.direcao * Math.PI / 180;
    return { x: p.x, y: p.y, centro, angulo: centro, cone: [] };
});

let tempoJogo = 0;   // segundos desde o início da invasão
let deteccao = 0;   // 0 a 1 (barra de alerta)
let estadoJogo = 'jogando';   // 'jogando', 'falhou' ou 'venceu'

// Estado da missão
let cofresAbertos = 0;
let temPendrive = false;        // provisório: o pendrive é obtido ao abrir TODOS os cofres do mapa
let codigoAtual = '';           // um código por vez; abre qualquer cofre ainda fechado
let codigoVisivelAte = 0;       // tempoJogo até o qual o código fica visível
let painelAberto = false;       // o jogo NÃO pausa com o painel aberto (provisório)
let cofreAtivo = null;
let digitado = '';

function novoCodigo() {
    codigoAtual = String(Math.floor(Math.random() * Math.pow(10, DIGITOS_CODIGO))).padStart(DIGITOS_CODIGO, '0');
    codigoVisivelAte = tempoJogo + TEMPO_CODIGO;
}
novoCodigo();   // primeiro código, exibido no início da infiltração

// Tempo para a barra encher com um guarda vendo o jogador: mín + (máx − mín) × precisão²
const TEMPO_PARA_ENCHER = TEMPO_DETECCAO_MIN[dificuldade] +
    (TEMPO_DETECCAO_MAX[dificuldade] - TEMPO_DETECCAO_MIN[dificuldade]) * precisao * precisao;

function ehParede(col, lin) {
    if (col < 0 || lin < 0 || col >= colunas || lin >= linhas) return true;
    return grade[lin][col] === '#';
}

function colide(x, y) {
    const m = TAMANHO_JOGADOR / 2;
    const c0 = Math.floor((x - m) / TILE), c1 = Math.floor((x + m - 0.001) / TILE);
    const l0 = Math.floor((y - m) / TILE), l1 = Math.floor((y + m - 0.001) / TILE);
    for (let l = l0; l <= l1; l++) {
        for (let c = c0; c <= c1; c++) {
            if (ehParede(c, l)) return true;
        }
    }
    return false;
}

// Move um eixo por vez: ao bater numa parede, o jogador desliza no outro eixo
function mover(dx, dy) {
    if (dx && !colide(jogador.x + dx, jogador.y)) jogador.x += dx;
    if (dy && !colide(jogador.x, jogador.y + dy)) jogador.y += dy;
}

// ---- Entrada (só WASD) ----
const teclas = {};
window.addEventListener('keydown', aoPressionar);
window.addEventListener('keyup', e => { teclas[e.code] = false; });
window.addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; });

// ---- Canvas ----
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// HUD e tela de resultados
const barraNivel = document.getElementById('barra-alerta-nivel');
const telaResultado = document.getElementById('tela-resultado');
const tituloResultado = document.getElementById('resultado-titulo');
const pontuacaoResultado = document.getElementById('resultado-pontuacao');
const hudTempo = document.getElementById('hud-tempo');
const hudCofres = document.getElementById('hud-cofres');
const hudPendrive = document.getElementById('hud-pendrive');
const hudCodigo = document.getElementById('hud-codigo');
const painelCofre = document.getElementById('painel-cofre');
const digitosPainel = painelCofre.querySelectorAll('#painel-digitos span');
document.getElementById('botao-jogar-de-novo').addEventListener('click', () => {
    location.href = 'principal.html';   // "jogar de novo" volta para a tela inicial (combinado)
});

// DEBUG provisório (etapas 1 a 5): será removido/substituído pelo HUD na etapa 4
document.getElementById('debug').textContent =
    'Dificuldade: ' + NOMES_DIFICULDADE[dificuldade] + ' | Precisão: ' + precisaoPct + '% | Mapa: ' + mapa.nome + avisoFallback +
    ' | Validação: ' + (problemas.length ? problemas.length + ' problema(s), ver console' : 'OK');

function normalizarAngulo(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

function paredeEmPx(px, py) {
    return ehParede(Math.floor(px / TILE), Math.floor(py / TILE));
}

// Cone de visão: leque de raios que param nas paredes ou no alcance máximo.
// Devolve o polígono [origem, ponto do raio 0, ..., ponto do último raio] (coordenadas do mapa).
function calcularCone(x, y, angulo) {
    const pontos = [{ x, y }];
    const meio = (ANGULO_VISAO * Math.PI / 180) / 2;
    for (let i = 0; i <= RAIOS_CONE; i++) {
        const a = angulo - meio + (2 * meio) * i / RAIOS_CONE;
        const dx = Math.cos(a), dy = Math.sin(a);
        let d = 0;
        while (d + PASSO_RAIO <= ALCANCE_VISAO && !paredeEmPx(x + dx * (d + PASSO_RAIO), y + dy * (d + PASSO_RAIO))) {
            d += PASSO_RAIO;
        }
        pontos.push({ x: x + dx * d, y: y + dy * d });
    }
    return pontos;
}

function atualizarGuarda(g, dt) {
    // Anda em linha reta até o próximo ponto da rota; ao chegar, segue para o seguinte (em ciclo)
    const alvo = g.pontos[g.alvo];
    const dx = alvo.x - g.x, dy = alvo.y - g.y;
    const dist = Math.hypot(dx, dy);
    const passo = VELOCIDADE_GUARDA * dt;
    if (dist <= passo) {
        g.x = alvo.x;
        g.y = alvo.y;
        g.alvo = (g.alvo + 1) % g.pontos.length;
    } else {
        g.x += dx / dist * passo;
        g.y += dy / dist * passo;
    }
    // Olha na direção do próximo ponto, com giro suave
    const prox = g.pontos[g.alvo];
    const desejado = Math.atan2(prox.y - g.y, prox.x - g.x);
    const diff = normalizarAngulo(desejado - g.angulo);
    const maxGiro = VELOCIDADE_GIRO_GUARDA * dt;
    g.angulo = normalizarAngulo(g.angulo + Math.max(-maxGiro, Math.min(maxGiro, diff)));
    g.cone = calcularCone(g.x, g.y, g.angulo);
}

function atualizarCamera(c) {
    // Varredura senoidal: desacelera nas pontas e passa mais rápido pelo centro
    const amplitude = (VARREDURA_CAMERA * Math.PI / 180) / 2;
    c.angulo = c.centro + amplitude * Math.sin(2 * Math.PI * tempoJogo / CICLO_CAMERA);
    c.cone = calcularCone(c.x, c.y, c.angulo);
}

function formatarTempo(seg) {
    const t = Math.floor(seg);
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

// Fim da missão. A pontuação da vitória entra na etapa 6; aqui só mostramos o tempo.
function encerrar(resultado) {
    estadoJogo = resultado;
    painelAberto = false;
    painelCofre.classList.add('hidden');
    tituloResultado.textContent = resultado === 'venceu' ? 'Missão cumprida' : 'Missão falhou';
    pontuacaoResultado.textContent = resultado === 'venceu' ? 'Tempo: ' + formatarTempo(tempoJogo) : 'Pontuação: 0';
    telaResultado.classList.remove('hidden');   // falha = pontuação zero, sem botão de ranking
}

// ---- Painel numérico do cofre ----
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

// Cofre fechado mais próximo dentro do alcance de interação (ou null)
function cofreAoAlcance() {
    let melhor = null, melhorDist = ALCANCE_INTERACAO;
    cofres.forEach(c => {
        if (c.aberto) return;
        const d = Math.hypot(c.x - jogador.x, c.y - jogador.y);
        if (d <= melhorDist) { melhor = c; melhorDist = d; }
    });
    return melhor;
}

function tentarAbrirPainel() {
    const cofre = cofreAoAlcance();
    if (cofre) abrirPainel(cofre);
}

function confirmarCodigo() {
    if (digitado !== codigoAtual) {   // código errado: só limpa o painel
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
        novoCodigo();   // ao abrir um cofre, o próximo código aparece
    }
}

function aoPressionar(e) {
    teclas[e.code] = true;
    if (estadoJogo !== 'jogando') return;
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
    const mostrarCodigo = codigoAtual !== '' && tempoJogo < codigoVisivelAte;
    hudCodigo.classList.toggle('hidden', !mostrarCodigo);
    if (mostrarCodigo) hudCodigo.textContent = 'Código: ' + codigoAtual;
    // Com o pendrive, chegar à saída vence a missão
    if (temPendrive && saida &&
        Math.floor(jogador.x / TILE) === saida.col && Math.floor(jogador.y / TILE) === saida.lin) {
        encerrar('venceu');
    }
}

function pontoNoPoligono(px, py, poly) {
    let dentro = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
}

function atualizarDeteccao(dt) {
    // O cone já é cortado pelas paredes, então estar dentro dele = ser visto.
    // Se vários vigias veem o jogador, vale o mais rápido.
    let taxa = 0;   // fração da barra por segundo
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
    barraNivel.style.backgroundColor = 'hsl(' + Math.round(200 * (1 - deteccao)) + ', 85%, 55%)';   // azul → vermelho (provisório)

    if (deteccao >= 1) encerrar('falhou');
}

function atualizar(dt) {
    if (estadoJogo !== 'jogando') return;
    let dx = (teclas.KeyD ? 1 : 0) - (teclas.KeyA ? 1 : 0);
    let dy = (teclas.KeyS ? 1 : 0) - (teclas.KeyW ? 1 : 0);
    if (painelAberto) { dx = 0; dy = 0; }   // com o painel aberto o jogador fica parado
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    mover(dx * VELOCIDADE_JOGADOR * dt, dy * VELOCIDADE_JOGADOR * dt);

    tempoJogo += dt;
    guardas.forEach(g => atualizarGuarda(g, dt));
    cameras.forEach(atualizarCamera);
    atualizarDeteccao(dt);
    atualizarMissao();
}

function desenhar(nome, x, y, w, h, cor) {
    const img = imagens[nome];
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
            const c = grade[lin][col];
            const x = col * TILE, y = offsetY + lin * TILE;
            if (c === '#') {
                desenhar('parede', x, y, TILE, TILE, '#475569');
            } else {
                desenhar('chao', x, y, TILE, TILE, '#0f172a');
                if (c === 'P') desenhar('inicio', x, y, TILE, TILE, '#0369a1');
                if (c === 'E') desenhar('saida', x, y, TILE, TILE, '#22c55e');
                if (c === 'S') {
                    const aberto = cofres.some(cf => cf.col === col && cf.lin === lin && cf.aberto);
                    desenhar(aberto ? 'cofre_aberto' : 'cofre', x, y, TILE, TILE, aberto ? '#78350f' : '#f59e0b');
                }
            }
        }
    }

    // Cones de visão (semitransparentes)
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

    // Vigias (placeholders)
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

// Indício de que dá para abrir o cofre: um pequeno "L" sobre ele, enquanto o jogador está no alcance
function desenharIndicadorInteracao() {
    if (estadoJogo !== 'jogando' || painelAberto) return;
    const cofre = cofreAoAlcance();
    if (!cofre) return;
    const lado = 22;
    const x = cofre.x - lado / 2;
    const y = offsetY + cofre.y - TILE / 2 - lado - 6;
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

// ---- Loop ----
let ultimo = performance.now();
function loop(agora) {
    const dt = Math.min((agora - ultimo) / 1000, 0.05);   // limita o passo para não atravessar paredes
    ultimo = agora;
    atualizar(dt);
    renderizar();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);