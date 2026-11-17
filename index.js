$('#inicio').on('click', () => {
    $('#dificuldade').show();
    $('#ranking').hide();
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