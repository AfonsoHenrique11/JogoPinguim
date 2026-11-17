// Verifica se o usuário está logado ao carregar a página inicial para mostrar o avatar/nome
$(document).ready(() => {
    const usuarioLogadoStr = localStorage.getItem('pinguim_logado');
    if (usuarioLogadoStr) {
        const usuario = JSON.parse(usuarioLogadoStr);
        $('#nome-usuario-logado').text(usuario.nome);
        if (usuario.avatar) {
            $('#avatar-atual').attr('src', usuario.avatar);
        }
        $('#perfil-usuario').css('display', 'flex');
    }
});

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