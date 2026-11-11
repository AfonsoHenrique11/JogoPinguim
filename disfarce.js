let botao = document.querySelector('#verAlvo');
botao.addEventListener('click', () => {
    setTimeout(() => {
    document.getElementById("alvo").style.display = "block";
}, 1000);
    setTimeout(() => {
    document.getElementById("alvo").style.display = "none";
}, 5000);
    setTimeout(() => {
    document.getElementById("disfarce").style.display = "block";
}, 5000);
    setTimeout(() => {
    document.getElementById("verAlvo").style.display = "none";
}, 5000);
    setTimeout(() => {
    document.getElementById("atencao").style.display = "none";
}, 5000);
})

let acessorios = document.querySelectorAll('.acessorio');
acessorios.forEach((acessorio) => {
    acessorio.addEventListener('click', ()=>{
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
    'imgs/chapeu_palha.png'
];
let camisas = [
    'imgs/blusa_preta.png',
    'imgs/blusa_vermelha.png'
];
let colares = [
    'imgs/colar_dourado.png',
    'imgs/colar_perolas.png'
];
let oculos = [
    'imgs/oculos_escuros.png',
    'imgs/oculos_redondos.png'
];
let cabelos = [
    'imgs/peruca_castanha.png',
    'imgs/peruca_loira.png'
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

let acertou = 0;
let hatPin = document.getElementById('chapeu-escolhido');
let hatPap = document.getElementById('chapeu-alvo');
if (hatPin.getAttribute('src') === hatPap.getAttribute('src')) {
    acertou++;
}

let colPin = document.getElementById('colar-escolhido');
let colPap = document.getElementById('colar-alvo');
if (colPin.getAttribute('src') === colPap.getAttribute('src')) {
    acertou++;
}

let hairPin = document.getElementById('cabelo-escolhido');
let hairPap = document.getElementById('cabelo-alvo');
if (hairPin.getAttribute('src') === hairPap.getAttribute('src')) {
    acertou++;
}

let glassPin = document.getElementById('oculos-escolhido');
let glassPap = document.getElementById('oculos-alvo');
if (glassPin.getAttribute('src') === glassPap.getAttribute('src')) {
    acertou++;
}

let camPin = document.getElementById('camisa-escolhida');
let camPap = document.getElementById('camisa-alvo');
if (camPin.getAttribute('src') === camPap.getAttribute('src')) {
    acertou++;
}

localStorage.setItem('precisao', acertou);