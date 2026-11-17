const formUsuario = document.getElementById('form-usuario');
const secaoLogin = document.getElementById('secao-login');
const secaoJogo = document.getElementById('secao-jogo');
const saudacao = document.getElementById('saudacao');
const mensagemAlerta = document.getElementById('mensagem-alerta');

formUsuario.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('usuario-nome').value.trim();
    const senha = document.getElementById('usuario-senha').value.trim();

    if (!nome || !senha) {
        mensagemAlerta.innerText = "Preencha todos os campos!";
        return;
    }

    // Pega a lista de usuários salvos no localStorage
    let usuarios = JSON.parse(localStorage.getItem('pinguims')) || [];

    // Procura se o usuário já existe
    let usuarioEncontrado = usuarios.find(u => u.nome === nome);

    if (usuarioEncontrado) {
        // Se existe, valida a senha
        if (usuarioEncontrado.senha === senha) {
            salvarSessao(nome);
        } else {
            mensagemAlerta.innerText = "Senha incorreta!";
        }
    } else {
        // Se não existe, cadastra automaticamente e já faz o login
        usuarios.push({ nome, senha });
        localStorage.setItem('pinguims', JSON.stringify(usuarios));
        salvarSessao(nome);
    }
});

function salvarSessao(nome) {
    localStorage.setItem('pinguim_logado', nome);
    entrarNoJogo(nome);
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

// Verifica automaticamente se já há um usuário conectado ao abrir a página
window.onload = function() {
    const usuarioLogado = localStorage.getItem('pinguim_logado');
    if (usuarioLogado) {
        entrarNoJogo(usuarioLogado);
    }
};