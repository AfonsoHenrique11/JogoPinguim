const CHAVE_RANKING = 'pinguinsEspioes.ranking';
const CHAVE_PARTIDA = 'pinguinsEspioes.partida';
const MAX_ENTRADAS = 10;
const NICKNAME_MAX = 12;
const PONTUACAO_MAXIMA = 1000;

// Armazenamento
let armazenamentoOk = true;

function lerBruto(chave) {
    try { return localStorage.getItem(chave); } catch (e) { armazenamentoOk = false; return null; }
}

function gravar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { armazenamentoOk = false; }
}

function entradaValida(e) {
    return e && typeof e.nick === 'string' && e.nick.length >= 1 && e.nick.length <= NICKNAME_MAX &&
        Number.isInteger(e.pontos) && e.pontos >= 0 && e.pontos <= PONTUACAO_MAXIMA;
}

function lerDados() {
    const dados = [[], [], [], []];
    const bruto = lerBruto(CHAVE_RANKING);
    if (!bruto) return dados;
    try {
        const lido = JSON.parse(bruto);
        for (let d = 0; d < 4; d++) {
            if (Array.isArray(lido[d])) dados[d] = lido[d].filter(entradaValida).slice(0, MAX_ENTRADAS);
        }
    } catch (e) {
        console.warn('Ranking salvo ilegível; começando vazio.');
    }
    return dados;
}

// Partida da invasão
function lerPartida() {
    const bruto = lerBruto(CHAVE_PARTIDA);
    if (bruto === null) return null;
    try { localStorage.removeItem(CHAVE_PARTIDA); } catch (e) { armazenamentoOk = false; }

    let p;
    try { p = JSON.parse(bruto); } catch (e) { p = null; }
    const nick = p && typeof p.nick === 'string' ? p.nick.trim() : '';
    const ok = p && nick.length >= 1 && nick.length <= NICKNAME_MAX &&
        Number.isInteger(p.pontos) && p.pontos >= 0 && p.pontos <= PONTUACAO_MAXIMA &&
        Number.isInteger(p.dif) && p.dif >= 0 && p.dif <= 3;
    if (!ok) {
        console.warn('Dados da partida inválidos; nada foi registrado.');
        return null;
    }
    return { nick, pontos: p.pontos, dif: p.dif };
}

// Registra a partida
function registrar(partida, dados) {
    const entrada = { nick: partida.nick, pontos: partida.pontos };
    const lista = dados[partida.dif];
    lista.push(entrada);
    lista.sort((a, b) => b.pontos - a.pontos);
    const dentro = lista.indexOf(entrada) < MAX_ENTRADAS;
    dados[partida.dif] = lista.slice(0, MAX_ENTRADAS);
    gravar(CHAVE_RANKING, JSON.stringify(dados));
    return { dif: partida.dif, entrada: dentro ? entrada : null, foraDoTop: !dentro, pontos: partida.pontos };
}

// Tela
const NOMES_DIFICULDADE = ['Fácil', 'Normal', 'Difícil', 'Impossível'];
const paineis = document.getElementById('paineis');
const avisoArmazenamento = document.getElementById('aviso-armazenamento');

const dados = lerDados();
const partida = lerPartida();
const resultado = partida ? registrar(partida, dados) : null;

function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function criarPainel(dif) {
    const painel = criar('section', 'painel dif-' + dif);
    if (resultado && resultado.dif === dif) painel.classList.add('atual');
    painel.appendChild(criar('h2', '', NOMES_DIFICULDADE[dif]));

    const lista = dados[dif];
    if (lista.length === 0) {
        painel.appendChild(criar('p', 'vazio', 'Ainda não há pontuações.'));
    } else {
        const tabela = criar('table');
        const cabecalho = criar('tr');
        ['#', 'Nickname', 'Pontuação'].forEach(t => cabecalho.appendChild(criar('th', '', t)));
        tabela.appendChild(criar('thead')).appendChild(cabecalho);
        const corpo = criar('tbody');
        lista.forEach((e, i) => {
            const tr = criar('tr');
            [i + 1, e.nick, e.pontos].forEach(v => tr.appendChild(criar('td', '', v)));
            if (resultado && e === resultado.entrada && dif === resultado.dif) tr.classList.add('destaque');
            corpo.appendChild(tr);
        });
        tabela.appendChild(corpo);
        painel.appendChild(tabela);
    }

    if (resultado && resultado.foraDoTop && resultado.dif === dif) {
        painel.appendChild(criar('p', 'aviso', 'Sua pontuação (' + resultado.pontos + ') ficou fora do top ' + MAX_ENTRADAS + '.'));
    }
    return painel;
}

for (let dif = 0; dif < 4; dif++) paineis.appendChild(criarPainel(dif));

if (!armazenamentoOk) {
    avisoArmazenamento.textContent = 'Não foi possível salvar o ranking neste navegador.';
    avisoArmazenamento.classList.remove('hidden');
}