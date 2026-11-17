const formUsuario = document.getElementById('form-usuario');
const secaoLogin = document.getElementById('secao-login');
const secaoJogo = document.getElementById('secao-jogo');
const saudacao = document.getElementById('saudacao');
const mensagemAlerta = document.getElementById('mensagem-alerta');

formUsuario.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('usuario-nome').value.trim();
    const senha = document.getElementById('usuario-senha').value.trim();
    const radioSelecionado = document.querySelector('input[name="avatar"]:checked');

    if (!nome || !senha) {
        mensagemAlerta.innerText = "Preencha todos os campos!";
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem('pinguims')) || [];
    let usuarioEncontrado = usuarios.find(u => u.nome === nome);

    // Função interna para finalizar o salvamento e login
    const prosseguirComAvatar = (avatarFinal) => {
        if (usuarioEncontrado) {
            if (usuarioEncontrado.senha === senha) {
                usuarioEncontrado.avatar = avatarFinal;
                localStorage.setItem('pinguims', JSON.stringify(usuarios));
                salvarSessao(usuarioEncontrado);
            } else {
                mensagemAlerta.innerText = "Senha incorreta!";
            }
        } else {
            const novoUsuario = { nome, senha, avatar: avatarFinal };
            usuarios.push(novoUsuario);
            localStorage.setItem('pinguims', JSON.stringify(usuarios));
            salvarSessao(novoUsuario);
        }
    };

    // Se a opção selecionada for o upload de arquivo personalizado
    if (radioSelecionado && radioSelecionado.value === 'upload') {
        const inputArquivo = document.getElementById('input-arquivo-avatar');
        if (inputArquivo.files && inputArquivo.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                prosseguirComAvatar(event.target.result); // Base64 da imagem
            };
            reader.readAsDataURL(inputArquivo.files[0]);
        } else {
            mensagemAlerta.innerText = "Por favor, selecione uma imagem para o upload!";
        }
    } else {
        const avatarSelecionado = radioSelecionado ? radioSelecionado.value : 'imgs/pinguim.png';
        prosseguirComAvatar(avatarSelecionado);
    }
});

function salvarSessao(usuario) {
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