const formUsuario = document.getElementById('form-usuario');
const secaoLogin = document.getElementById('secao-login');
const secaoJogo = document.getElementById('secao-jogo');
const saudacao = document.getElementById('saudacao');
const mensagemAlerta = document.getElementById('mensagem-alerta');

formUsuario.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('usuario-nome').value.trim();
    const senha = document.getElementById('usuario-senha').value.trim();
    const avatarSelecionado = document.querySelector('input[name="avatar"]:checked').value;

    if (!nome || !senha) {
        mensagemAlerta.innerText = "Preencha todos os campos!";
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem('pinguims')) || [];
    let usuarioEncontrado = usuarios.find(u => u.nome === nome);

    if (usuarioEncontrado) {
        if (usuarioEncontrado.senha === senha) {
            // Atualiza o avatar caso ele tenha mudado na tela de login
            usuarioEncontrado.avatar = avatarSelecionado;
            localStorage.setItem('pinguims', JSON.stringify(usuarios));
            salvarSessao(usuarioEncontrado);
        } else {
            mensagemAlerta.innerText = "Senha incorreta!";
        }
    } else {
        // Cria novo usuário com o avatar escolhido
        const novoUsuario = { nome, senha, avatar: avatarSelecionado };
        usuarios.push(novoUsuario);
        localStorage.setItem('pinguims', JSON.stringify(usuarios));
        salvarSessao(novoUsuario);
    }
});

function salvarSessao(usuario) {
    // Salva o objeto completo do usuário logado para facilitar o acesso à foto e nome
    localStorage.setItem('pinguim_logado', JSON.stringify(usuario));
    entrarNoJogo(usuario.nome);
}

function entrarNoJogo(nome) {
    secaoLogin.style.display = 'none';
    secaoJogo.style.display = 'block';
    saudacao.innerText = `Olá, ${nome}! Pronto para jogar?`;
}

function fazerLogout() {
    localStorage.removeItem('pinguim_logado');
    location.reload();
}

window.onload = function() {
    const usuarioLogadoStr = localStorage.getItem('pinguim_logado');
    if (usuarioLogadoStr) {
        const usuario = JSON.parse(usuarioLogadoStr);
        entrarNoJogo(usuario.nome);
    }
};