$('#inicio').on('click', () => {
    // Verifica se o usuário está logado usando a mesma chave do login.js
    const usuarioLogado = localStorage.getItem('pinguim_logado');

    if (!usuarioLogado) {
        // Se não tiver conta logada, redireciona para a tela de login
        alert('Você precisa fazer login antes de iniciar a missão!');
        location.href = "login.html";
        return;
    }

    // Se estiver logado, abre normalmente a seleção de dificuldade
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
$('#conta').on('click', () => {
    location.href = "login.html";
});