$('#inicio').on('click', () => {
    const usuarioLogado = localStorage.getItem('pinguim_logado');

    if (!usuarioLogado) {
        alert('Você precisa fazer login antes de iniciar a missão!');
        location.href = "login.html";
        return;
    }

    $('#dificuldade').show();
    $('#ranking').hide();
    $('#creditos').hide();
    $('#conta').hide();
});

const configurarDificuldade = (seletor, valor) => {
    $(seletor).on('click', () => {
        $('#dificuldade').hide();
        localStorage.setItem('dificuldade', valor);
        location.href = "disfarcando.html";
    });
};

configurarDificuldade('#facil', 0);
configurarDificuldade('#normal', 1);
configurarDificuldade('#dificil', 2);
configurarDificuldade('#impossivel', 3);

$('#ranking').on('click', () => {
    location.href = "ranking.html";
});
$('#creditos').on('click', () => {
    location.href = "creditos.html";
});
$('#conta').on('click', () => {
    location.href = "login.html";
});