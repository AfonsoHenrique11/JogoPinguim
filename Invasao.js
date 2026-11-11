const TILE = 32;
const LARGURA = 1024;
const ALTURA = 640;
const VELOCIDADE_JOGADOR = 140;
const TAMANHO_JOGADOR = 20;
const DIF_PADRAO = 0;
const PREC_PADRAO = 100;
const COLUNAS_MAPA = 32;
const LINHAS_MIN = 9;
const LINHAS_MAX = 19;
const NOMES_DIFICULDADE = ['Fácil', 'Normal', 'Difícil', 'Impossível'];
const GUARDAS_E_CAMERAS = [2, 4, 6, 8];

// Vigias
const VELOCIDADE_GUARDA = 100;
const VELOCIDADE_GIRO_GUARDA = 4;
const ALCANCE_VISAO = 160;
const ANGULO_VISAO = 60;
const VARREDURA_CAMERA = 90;
const CICLO_CAMERA = 4;
const RAIOS_CONE = 40;
const PASSO_RAIO = 2;

// Detecção (um valor por dificuldade)
const TEMPO_DETECCAO_MAX = [8, 6, 4, 2.5];
const TEMPO_DETECCAO_MIN = [2, 1.5, 1, 0.5];
const ESVAZIAMENTO_BARRA = [0.5, 0.35, 0.2, 0.1];
const MULT_CAMERA = 1.5;

// Cofres
const DIGITOS_CODIGO = 4;
const TEMPO_CODIGO = 7;
const ALCANCE_INTERACAO = 48;

// Pontuação
const PONTUACAO_MAXIMA = 1000;
const PESO_DISFARCE = 0.35;
const PESO_TEMPO = 0.65;
const TEMPO_EXTRA = [20, 25, 30, 35];
const TEMPO_ZERO = [60, 120, 180, 240];
const NICKNAME_MAX = 12;

// Imagens por nome (opcional): parede, chao, inicio, saida, cofre, cofre_aberto, jogador, guarda, camera
const IMAGENS_INVASAO = {};
const imagens = {};
for (const nome in IMAGENS_INVASAO) {
    const img = new Image();
    img.onload = () => { imagens[nome] = img; };
    img.src = IMAGENS_INVASAO[nome];
}

// Dificuldade (0 a 3) e precisão (0 a 100), gravadas no localStorage pelas páginas anteriores
const CHAVE_DIF = 'pinguinsEspioes.dificuldade';
const CHAVE_PREC = 'pinguinsEspioes.precisao';

function lerParametro(chave, padrao, ehValido) {
    let bruto = null;
    try {
        bruto = localStorage.getItem(chave);
    } catch (e) {
        console.warn('localStorage indisponível (' + e.name + ')');
    }
    if (bruto !== null && String(bruto).trim() !== '') {
        const valor = Number(bruto);
        if (ehValido(valor)) return valor;
        console.warn('Valor inválido em "' + chave + '": ' + bruto);
    }
    console.warn('"' + chave + '" não encontrado; usando padrão provisório: ' + padrao);
    return padrao;
}

const dificuldade = lerParametro(CHAVE_DIF, DIF_PADRAO, v => Number.isInteger(v) && v >= 0 && v <= 3);
const precisaoPct = lerParametro(CHAVE_PREC, PREC_PADRAO, v => Number.isFinite(v) && v >= 0 && v <= 100);
const precisao = precisaoPct / 100;

// Validador de mapas
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

    // Caminho do início até cofres e saída
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

    const guardas = m.guardas || [];
    if (guardas.length !== GUARDAS_E_CAMERAS[indice]) {
        erros.push('esperado ' + GUARDAS_E_CAMERAS[indice] + ' guardas, encontrado ' + guardas.length);
    }
    guardas.forEach((rota, i) => {
        if (!Array.isArray(rota) || rota.length < 2) { erros.push('guarda ' + i + ': rota precisa de ao menos 2 pontos'); return; }
        rota.forEach(([c, l], k) => {
            if (!livre(c, l)) erros.push('guarda ' + i + ': ponto ' + k + ' (' + c + ',' + l + ') fora do mapa ou em parede');
        });
        // A rota em linha reta não pode atravessar parede
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

// Mapa
const mapa = MAPAS[dificuldade];
validarMapa(mapa, dificuldade).forEach(p => console.warn('Mapa "' + mapa.nome + '": ' + p));

// Cores da página (usadas pelo CSS)
const tema = mapa.tema;
const CONTORNO = '#1b1b3a';
document.body.style.setProperty('--fundo-1', tema.fundo1);
document.body.style.setProperty('--fundo-2', tema.fundo2);
document.body.style.setProperty('--destaque', tema.destaque);

const grade = mapa.grade.map(l => l.split(''));
const linhas = grade.length;
const colunas = grade[0].length;
const offsetY = (ALTURA - linhas * TILE) / 2;

const jogador = { x: 0, y: 0 };
const cofres = [];
let saida = null;
grade.forEach((l, lin) => l.forEach((c, col) => {
    if (c === 'P') {
        jogador.x = col * TILE + TILE / 2;
        jogador.y = lin * TILE + TILE / 2;
    }
    if (c === 'S') cofres.push({ col, lin, x: col * TILE + TILE / 2, y: lin * TILE + TILE / 2, aberto: false });
    if (c === 'E') saida = { col, lin };
}));

// Guardas e câmeras
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

let tempoJogo = 0;
let deteccao = 0;
let estadoJogo = 'intro';

let cofresAbertos = 0;
let temPendrive = false;
let codigoAtual = '';
let codigoVisivelAte = 0;
let painelAberto = false;
let cofreAtivo = null;
let digitado = '';
let pontuacaoFinal = 0;

function novoCodigo() {
    codigoAtual = String(Math.floor(Math.random() * Math.pow(10, DIGITOS_CODIGO))).padStart(DIGITOS_CODIGO, '0');
    codigoVisivelAte = tempoJogo + TEMPO_CODIGO;
}
novoCodigo();

// Tempo para a barra encher: mín + (máx − mín) × precisão²
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

// Move um eixo por vez (desliza nas paredes)
function mover(dx, dy) {
    if (dx && !colide(jogador.x + dx, jogador.y)) jogador.x += dx;
    if (dy && !colide(jogador.x, jogador.y + dy)) jogador.y += dy;
}

// Teclado
const teclas = {};
window.addEventListener('keydown', aoPressionar);
window.addEventListener('keyup', e => { teclas[e.code] = false; });
window.addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; });

// Canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// HUD e telas
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
const tempoResultado = document.getElementById('resultado-tempo');
const grupoRanking = document.getElementById('grupo-ranking');
const campoNickname = document.getElementById('campo-nickname');
const botaoRanking = document.getElementById('botao-ranking');
const telaIntro = document.getElementById('tela-intro');
const botaoComecar = document.getElementById('botao-comecar');
document.getElementById('botao-jogar-de-novo').addEventListener('click', () => {
    location.href = 'index.html';
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

// Cone de visão: raios que param nas paredes
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
    // Anda até o próximo ponto da rota
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
    // Olha para o próximo ponto
    const prox = g.pontos[g.alvo];
    const desejado = Math.atan2(prox.y - g.y, prox.x - g.x);
    const diff = normalizarAngulo(desejado - g.angulo);
    const maxGiro = VELOCIDADE_GIRO_GUARDA * dt;
    g.angulo = normalizarAngulo(g.angulo + Math.max(-maxGiro, Math.min(maxGiro, diff)));
    g.cone = calcularCone(g.x, g.y, g.angulo);
}

function atualizarCamera(c) {
    // Varredura suave
    const amplitude = (VARREDURA_CAMERA * Math.PI / 180) / 2;
    c.angulo = c.centro + amplitude * Math.sin(2 * Math.PI * tempoJogo / CICLO_CAMERA);
    c.cone = calcularCone(c.x, c.y, c.angulo);
}

// Pontuação final (0 a 1000)
function calcularPontuacao(tempo) {
    const extra = TEMPO_EXTRA[dificuldade], zero = TEMPO_ZERO[dificuldade];
    const fatorTempo = Math.max(0, Math.min(1, 1 - (tempo - extra) / (zero - extra)));
    return Math.round(PONTUACAO_MAXIMA * (PESO_DISFARCE * precisao + PESO_TEMPO * fatorTempo));
}

function nickValido(texto) {
    const n = texto.trim();
    return n.length >= 1 && n.length <= NICKNAME_MAX;
}

// Passa a partida ao ranking pelo localStorage
const CHAVE_PARTIDA = 'pinguinsEspioes.partida';
function irParaRanking() {
    const nick = campoNickname.value.trim();
    if (estadoJogo !== 'venceu' || !nickValido(nick)) return;
    try {
        localStorage.setItem(CHAVE_PARTIDA, JSON.stringify({ nick, pontos: pontuacaoFinal, dif: dificuldade }));
    } catch (e) {
        console.warn('Não foi possível gravar a partida para o ranking (' + e.name + ')');
    }
    location.href = 'ranking.html';
}

// Intro
function iniciarMissao() {
    if (estadoJogo !== 'intro') return;
    estadoJogo = 'jogando';
    telaIntro.classList.add('hidden');
}

document.getElementById('intro-titulo').textContent = mapa.nome;
document.getElementById('intro-info').textContent = 'Dificuldade: ' + NOMES_DIFICULDADE[dificuldade] + ' · ' +
    cofres.length + (cofres.length === 1 ? ' cofre' : ' cofres');
document.getElementById('intro-missao').textContent =
    (cofres.length === 1 ? 'Abra o cofre' : 'Abra os ' + cofres.length + ' cofres') +
    ', pegue o pendrive e fuja pela saída sem ser detectado.';
botaoComecar.addEventListener('click', iniciarMissao);
botaoComecar.focus();

function formatarTempo(seg) {
    const t = Math.floor(seg);
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

// Fim da missão
function encerrar(resultado) {
    estadoJogo = resultado;
    painelAberto = false;
    painelCofre.classList.add('hidden');
    const venceu = resultado === 'venceu';
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

// Painel do cofre
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

// Cofre fechado ao alcance do jogador
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
    if (estadoJogo === 'intro' && e.code === 'KeyL') iniciarMissao();
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
    const mostrarCodigo = codigoAtual !== '' && tempoJogo < codigoVisivelAte;
    hudCodigo.classList.toggle('hidden', !mostrarCodigo);
    if (mostrarCodigo) hudCodigo.textContent = 'Código: ' + codigoAtual;
    // Com o pendrive, a saída vence
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
    // Dentro do cone = visto; vale o vigia mais rápido
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
    barraNivel.style.backgroundColor = 'hsl(' + Math.round(130 * (1 - deteccao)) + ', 90%, 50%)';

    if (deteccao >= 1) encerrar('falhou');
}

function atualizar(dt) {
    if (estadoJogo !== 'jogando') return;
    const direita = teclas.KeyD || teclas.ArrowRight;
    const esquerda = teclas.KeyA || teclas.ArrowLeft;
    const baixo = teclas.KeyS || teclas.ArrowDown;
    const cima = teclas.KeyW || teclas.ArrowUp;
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

// Usa a imagem se existir; senão, o desenho
function desenhar(nome, x, y, w, h, placeholder) {
    if (imagens[nome]) ctx.drawImage(imagens[nome], x, y, w, h);
    else placeholder();
}

function contorno(largura) {
    ctx.lineWidth = largura;
    ctx.strokeStyle = CONTORNO;
    ctx.stroke();
}

function placeholderChao(x, y, col, lin) {
    ctx.fillStyle = (col + lin) % 2 ? tema.chao2 : tema.chao;
    ctx.fillRect(x, y, TILE, TILE);
}

function placeholderParede(x, y, col, lin) {
    ctx.fillStyle = tema.parede;
    ctx.fillRect(x, y, TILE, TILE);
    if (!ehParede(col, lin - 1)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, TILE, 4);
    }
    if (!ehParede(col, lin + 1)) {
        ctx.fillStyle = tema.paredeFace;
        ctx.fillRect(x, y + TILE - 9, TILE, 9);
    }
}

function placeholderInicio(x, y) {
    ctx.fillStyle = tema.inicio;
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    contorno(3);
}

function placeholderSaida(x, y) {
    ctx.fillStyle = tema.saida;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, TILE - 6, TILE - 6, 8);
    ctx.fill();
    contorno(3);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 9);
    ctx.lineTo(x + 12, y + 23);
    ctx.lineTo(x + 23, y + 16);
    ctx.closePath();
    ctx.fill();
}

function placeholderCofre(x, y, aberto) {
    ctx.fillStyle = aberto ? '#8d8da8' : tema.cofre;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 4, TILE - 6, TILE - 7, 6);
    ctx.fill();
    contorno(3);
    if (aberto) {
        ctx.fillStyle = CONTORNO;
        ctx.fillRect(x + 8, y + 9, TILE - 16, TILE - 17);
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 + 1, 6, 0, Math.PI * 2);
        ctx.fill();
        contorno(2);
    }
}

function placeholderJogador(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffa62b';
    [-5, 5].forEach(dx => {
        ctx.beginPath();
        ctx.ellipse(dx, 12, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#23233f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    contorno(2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 4, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    [-4, 4].forEach(dx => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dx, -6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CONTORNO;
        ctx.beginPath();
        ctx.arc(dx, -5.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#ffa62b';
    ctx.beginPath();
    ctx.moveTo(-3, -1);
    ctx.lineTo(3, -1);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Os olhos apontam para onde o guarda olha
function placeholderGuarda(g) {
    ctx.save();
    ctx.translate(g.x, offsetY + g.y);
    ctx.fillStyle = tema.corGuarda;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    contorno(3);
    const fx = Math.cos(g.angulo), fy = Math.sin(g.angulo);
    [-1, 1].forEach(lado => {
        const ex = fx * 5 - fy * 4 * lado, ey = fy * 5 + fx * 4 * lado;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CONTORNO;
        ctx.beginPath();
        ctx.arc(ex + fx * 1.5, ey + fy * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function placeholderCamera(c) {
    ctx.save();
    ctx.translate(c.x, offsetY + c.y);
    ctx.rotate(c.angulo);
    ctx.fillStyle = '#2d2d52';
    ctx.beginPath();
    ctx.roundRect(-9, -7, 18, 14, 4);
    ctx.fill();
    contorno(2.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    contorno(2.5);
    ctx.fillStyle = '#ff3b5c';
    ctx.beginPath();
    ctx.arc(9, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function desenharCone(cone, cor) {
    if (cone.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(cone[0].x, offsetY + cone[0].y);
    for (let i = 1; i < cone.length; i++) ctx.lineTo(cone[i].x, offsetY + cone[i].y);
    ctx.closePath();
    ctx.save();
    ctx.fillStyle = cor;
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.restore();
}

function renderizar() {
    ctx.clearRect(0, 0, LARGURA, ALTURA);

    for (let lin = 0; lin < linhas; lin++) {
        for (let col = 0; col < colunas; col++) {
            const c = grade[lin][col];
            const x = col * TILE, y = offsetY + lin * TILE;
            if (c === '#') {
                desenhar('parede', x, y, TILE, TILE, () => placeholderParede(x, y, col, lin));
                continue;
            }
            desenhar('chao', x, y, TILE, TILE, () => placeholderChao(x, y, col, lin));
            if (c === 'P') desenhar('inicio', x, y, TILE, TILE, () => placeholderInicio(x, y));
            if (c === 'E') desenhar('saida', x, y, TILE, TILE, () => placeholderSaida(x, y));
            if (c === 'S') {
                const aberto = cofres.some(cf => cf.col === col && cf.lin === lin && cf.aberto);
                desenhar(aberto ? 'cofre_aberto' : 'cofre', x, y, TILE, TILE, () => placeholderCofre(x, y, aberto));
            }
        }
    }

    guardas.forEach(g => desenharCone(g.cone, tema.coneGuarda));
    cameras.forEach(c => desenharCone(c.cone, tema.coneCamera));

    guardas.forEach(g => desenhar('guarda', g.x - 12, offsetY + g.y - 12, 24, 24, () => placeholderGuarda(g)));
    cameras.forEach(c => desenhar('camera', c.x - 10, offsetY + c.y - 10, 20, 20, () => placeholderCamera(c)));
    desenhar('jogador', jogador.x - 13, offsetY + jogador.y - 14, 26, 28, () => placeholderJogador(jogador.x, offsetY + jogador.y));

    desenharIndicadorInteracao();
}

// "L" sobre o cofre ao alcance
function desenharIndicadorInteracao() {
    if (estadoJogo !== 'jogando' || painelAberto) return;
    const cofre = cofreAoAlcance();
    if (!cofre) return;
    const lado = 24;
    const x = cofre.x - lado / 2;
    const y = offsetY + cofre.y - TILE / 2 - lado - 6;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, lado, lado, 7);
    ctx.fillStyle = '#ffe066';
    ctx.fill();
    contorno(3);
    ctx.fillStyle = CONTORNO;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', cofre.x, y + lado / 2 + 1);
    ctx.restore();
}

// Loop
let ultimo = performance.now();
function loop(agora) {
    const dt = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    atualizar(dt);
    renderizar();
    requestAnimationFrame(loop);
}
guardas.forEach(g => atualizarGuarda(g, 0));
cameras.forEach(atualizarCamera);
requestAnimationFrame(loop);