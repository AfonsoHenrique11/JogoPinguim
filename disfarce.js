let botao = document.querySelector('#verAlvo');
botao.addEventListener('click', () => {
    document.getElementById("alvo").style.display = "block";

    setTimeout(() => {
    document.getElementById("alvo").style.display = "none";
},  5000-localStorage.getItem('dificuldade')*1000+1000);

    setTimeout(() => {
    document.getElementById("disfarce").style.display = "block";
}, 5000-localStorage.getItem('dificuldade')*1000+1000);
    setTimeout(() => {
    document.getElementById("verAlvo").style.display = "none";
}, 5000-localStorage.getItem('dificuldade')*1000+1000);
    setTimeout(() => {
    document.getElementById("atencao").style.display = "none";
}, 5000-localStorage.getItem('dificuldade')*1000+1000);
})

let acessorios = document.querySelectorAll('.acessorio');
acessorios.forEach((acessorio) => {
    acessorio.addEventListener('click', ()=>{
    if (!acessorio.dataset.alvo) return;
    let destino = document.getElementById(acessorio.dataset.alvo);
    if (destino.src === acessorio.src) 
        destino.style.display = 'none';

    else{
        destino.src = acessorio.src;
        destino.style.display = 'block';
    }
    })
});
let delet = document.querySelector('#lixo');
let acessories = document.querySelectorAll('.vestimenta');

delet.addEventListener('click', () => {
    acessories.forEach((acessory) => {
        acessory.src = '';
        acessory.style.display = 'none';
    });
});

let chapeus = [
    'imgs/cartola.png',
    'imgs/chapeu_palha.png',
    'imgs/boina.png',
    'imgs/cowboy.png',
    ''
];
let camisas = [
    'imgs/blusa_preta.png',
    'imgs/blusa_vermelha.png',
    'imgs/blusa_verde.png',
    'imgs/blusa_azul.png'
];
let colares = [
    'imgs/colar_dourado.png',
    'imgs/colar_perolas.png',
    'imgs/colar_diamante.png',
    'imgs/colar_praia.png',
    ''
];
let oculos = [
    'imgs/oculos_escuros.png',
    'imgs/oculos_redondos.png',
    'imgs/oculos_coracao.png',
    'imgs/oculos_rosa.png',
    ''
];
let cabelos = [
    'imgs/peruca_castanha.png',
    'imgs/peruca_loira.png',
    'imgs/peruca_preta.png',
    'imgs/peruca_curta.png',
    ''
];

function sortear(lista) {
    let sorteado = Math.floor(Math.random() * lista.length);
    return lista[sorteado];
}

document.getElementById('chapeu-alvo').src = sortear(chapeus);
document.getElementById('colar-alvo').src = sortear(colares);
document.getElementById('camisa-alvo').src = sortear(camisas);
document.getElementById('oculos-alvo').src = sortear(oculos);
document.getElementById('cabelo-alvo').src = sortear(cabelos);

function precisao(){
let acertou = 0;
let hatPin = document.getElementById('chapeu-escolhido');
let hatPap = document.getElementById('chapeu-alvo');
if (hatPin.src === hatPap.src) {
    acertou++;
}

let colPin = document.getElementById('colar-escolhido');
let colPap = document.getElementById('colar-alvo');
if (colPin.src === colPap.src) {
    acertou++;
}

let hairPin = document.getElementById('cabelo-escolhido');
let hairPap = document.getElementById('cabelo-alvo');
if (hairPin.src === hairPap.src) {
    acertou++;
}

let glassPin = document.getElementById('oculos-escolhidos');
let glassPap = document.getElementById('oculos-alvo');
if (glassPin.src === glassPap.src) {
    acertou++;
}

let camPin = document.getElementById('camisa-escolhida');
let camPap = document.getElementById('camisa-alvo');
if (camPin.src === camPap.src) {
    acertou++;
}

let porcentagem = (acertou / 5) * 100;
localStorage.setItem('precisao', porcentagem);
}

let finalizar = document.querySelector('#finalizar');
    finalizar.addEventListener('click', () => {
    precisao();
    location.href = "Invasao.html";
});