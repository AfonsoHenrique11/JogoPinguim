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

