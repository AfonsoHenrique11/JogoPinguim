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

document.addEventListener("DOMContentLoaded", function() {
    // Pega o nome do usuário que salvamos no localStorage durante o login
    const usuarioLogado = localStorage.getItem('pinguim_logado');

    // Supondo que você tenha um elemento no seu menu para mostrar o usuário ou o botão de login:
    const areaContaMenu = document.getElementById('area-conta-menu'); // Substitua pelo ID do elemento do seu menu

    if (usuarioLogado) {
        // Se estiver logado, mostra o nome/perfil e um botão de sair
        if (areaContaMenu) {
            areaContaMenu.innerHTML = `
                <span>Logado como: <strong>${usuarioLogado}</strong></span>
                <button onclick="fazerLogout()" style="margin-left: 10px;">Sair</button>
            `;
        }
    } else {
        // Se não estiver logado, mostra o botão para ir à tela de login
        if (areaContaMenu) {
            areaContaMenu.innerHTML = `
                <a href="login.html"><button>Entrar / Cadastrar</button></a>
            `;
        }
    }
});

// Função global para limpar a sessão e sair
function fazerLogout() {
    localStorage.removeItem('pinguim_logado');
    location.reload();
}