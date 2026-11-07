// ===== ranking.js — ranking local (localStorage) =====
// Entrada (vinda da invasão): ranking.html?nick=Ana&pontos=675&dif=1&id=<partida>
// Sem parâmetros, só mostra os rankings (por exemplo, a partir de um botão da tela inicial).

const CHAVE_RANKING = 'pinguinsEspioes.ranking';             // provisório
const CHAVE_ULTIMA_PARTIDA = 'pinguinsEspioes.ultimaPartida'; // evita registrar a mesma partida duas vezes (F5)
const MAX_ENTRADAS = 10;           // por dificuldade
const NICKNAME_MAX = 12;           // igual ao da invasão
const PONTUACAO_MAXIMA = 1000;     // mesma escala da invasão (provisório)

// ---- Armazenamento ----
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

// ---- Dados da partida na URL ----
const params = new URLSearchParams(location.search);

function lerPartida() {
    if (!params.has('nick') && !params.has('pontos')) return null;
    const nick = (params.get('nick') || '').trim();
    const pontos = params.get('pontos') || '';
    const dif = params.get('dif') || '';
    const id = params.get('id') || '';
    const ok = nick.length >= 1 && nick.length <= NICKNAME_MAX &&
        /^\d{1,4}$/.test(pontos) && Number(pontos) <= PONTUACAO_MAXIMA &&
        /^[0-3]$/.test(dif) && (id === '' || /^[\w.-]{1,40}$/.test(id));
    if (!ok) {
        console.warn('Dados da partida inválidos na URL; nada foi registrado.');
        return null;
    }
    return { nick, pontos: Number(pontos), dif: Number(dif), id: id || nick + '|' + pontos + '|' + dif };
}

// Registra a partida (se ainda não foi registrada) e devolve { dif, entrada, foraDoTop }
function registrar(partida, dados) {
    if (lerBruto(CHAVE_ULTIMA_PARTIDA) === partida.id) return { dif: partida.dif, entrada: null, foraDoTop: false };
    const entrada = { nick: partida.nick, pontos: partida.pontos };
    const lista = dados[partida.dif];
    lista.push(entrada);
    lista.sort((a, b) => b.pontos - a.pontos);   // ordenação estável: empates mantêm a ordem de chegada
    const dentro = lista.indexOf(entrada) < MAX_ENTRADAS;
    dados[partida.dif] = lista.slice(0, MAX_ENTRADAS);
    gravar(CHAVE_RANKING, JSON.stringify(dados));
    gravar(CHAVE_ULTIMA_PARTIDA, partida.id);
    return { dif: partida.dif, entrada: dentro ? entrada : null, foraDoTop: !dentro, pontos: partida.pontos };
}

// ---- Tela: hub com os 4 rankings visíveis ao mesmo tempo ----
const NOMES_DIFICULDADE = ['Fácil', 'Normal', 'Difícil', 'Impossível'];
const paineis = document.getElementById('paineis');
const avisoArmazenamento = document.getElementById('aviso-armazenamento');

const dados = lerDados();
const partida = lerPartida();
const resultado = partida ? registrar(partida, dados) : null;

function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;   // textContent: o nickname vem da URL, nunca como HTML
    return el;
}

function criarPainel(dif) {
    const painel = criar('section', 'painel');
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

// Limpa a URL para que atualizar a página não repita nada (se o navegador permitir; o id da partida já protege)
if (partida) {
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignorado */ }
}