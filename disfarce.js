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