const formUsuario = document.getElementById('form-usuario');
const secaoLogin = document.getElementById('secao-login');
const secaoJogo = document.getElementById('secao-jogo');
const saudacao = document.getElementById('saudacao');
const mensagemAlerta = document.getElementById('mensagem-alerta');
const avatarPerfilAtual = document.getElementById('avatar-perfil-atual');
const btnSalvarAvatar = document.getElementById('btn-salvar-avatar');
const msgAvatarSalvo = document.getElementById('msg-avatar-salvo');

// Seleciona automaticamente o radio de upload se o usuário escolher um arquivo
document.getElementById('input-arquivo-avatar').addEventListener('change', () => {
    document.getElementById('radio-upload').checked = true;
});
document.getElementById('input-arquivo-perfil').addEventListener('change', () => {
    document.getElementById('radio-upload-perfil').checked = true;
});

// 1. LOGIN / CRIAÇÃO DE CONTA
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

    // SE A CONTA JÁ EXISTIR: valida a senha e MANTÉM o avatar anterior
    if (usuarioEncontrado) {
        if (usuarioEncontrado.senha === senha) {
            salvarSessao(usuarioEncontrado);
        } else {
            mensagemAlerta.innerText = "Senha incorreta!";
        }
        return;
    }

    // SE FOR UMA CONTA NOVA: salva com o avatar escolhido na criação
    const criarNovaConta = (avatarFinal) => {
        const novoUsuario = { nome, senha, avatar: avatarFinal };
        usuarios.push(novoUsuario);
        localStorage.setItem('pinguims', JSON.stringify(usuarios));
        salvarSessao(novoUsuario);
    };

    if (radioSelecionado && radioSelecionado.value === 'upload') {
        const inputArquivo = document.getElementById('input-arquivo-avatar');
        if (inputArquivo.files && inputArquivo.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                criarNovaConta(event.target.result);
            };
            reader.readAsDataURL(inputArquivo.files[0]);
        } else {
            mensagemAlerta.innerText = "Por favor, selecione uma imagem para o upload!";
        }
    } else {
        const avatarSelecionado = radioSelecionado ? radioSelecionado.value : 'imgs/pinguim.png';
        criarNovaConta(avatarSelecionado);
    }
});

// 2. ALTERAR AVATAR QUANDO JÁ ESTIVER CONECTADO
btnSalvarAvatar.addEventListener('click', function() {
    const usuarioLogadoStr = localStorage.getItem('pinguim_logado');
    if (!usuarioLogadoStr) return;

    const usuarioLogado = JSON.parse(usuarioLogadoStr);
    const radioPerfil = document.querySelector('input[name="novo-avatar"]:checked');

    const aplicarNovoAvatar = (novoAvatar) => {
        // Atualiza a sessão atual
        usuarioLogado.avatar = novoAvatar;
        localStorage.setItem('pinguim_logado', JSON.stringify(usuarioLogado));

        // Atualiza também na lista geral de contas ('pinguims') para persistir no próximo login
        let usuarios = JSON.parse(localStorage.getItem('pinguims')) || [];
        const index = usuarios.findIndex(u => u.nome === usuarioLogado.nome);
        if (index !== -1) {
            usuarios[index].avatar = novoAvatar;
            localStorage.setItem('pinguims', JSON.stringify(usuarios));
        }

        // Atualiza a foto na tela imediatamente
        avatarPerfilAtual.src = novoAvatar;
        msgAvatarSalvo.style.color = '#16a34a';
        msgAvatarSalvo.innerText = 'Avatar atualizado com sucesso!';
        setTimeout(() => { msgAvatarSalvo.innerText = ''; }, 3000);
    };

    if (radioPerfil && radioPerfil.value === 'upload') {
        const inputArquivoPerfil = document.getElementById('input-arquivo-perfil');
        if (inputArquivoPerfil.files && inputArquivoPerfil.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                aplicarNovoAvatar(event.target.result);
            };
            reader.readAsDataURL(inputArquivoPerfil.files[0]);
        } else {
            msgAvatarSalvo.style.color = '#dc2626';
            msgAvatarSalvo.innerText = 'Selecione uma imagem primeiro!';
        }
    } else {
        const avatarEscolhido = radioPerfil ? radioPerfil.value : 'imgs/pinguim.png';
        aplicarNovoAvatar(avatarEscolhido);
    }
});

function salvarSessao(usuario) {
    localStorage.setItem('pinguim_logado', JSON.stringify(usuario));
    entrarNoJogo(usuario);
}

function entrarNoJogo(usuario) {
    secaoLogin.style.display = 'none';
    secaoJogo.style.display = 'block';
    saudacao.innerText = `Olá, ${usuario.nome}!`;
    avatarPerfilAtual.src = usuario.avatar || 'imgs/pinguim.png';
}

function fazerLogout() {
    localStorage.removeItem('pinguim_logado');
    location.reload();
}

window.onload = function() {
    const usuarioLogadoStr = localStorage.getItem('pinguim_logado');
    if (usuarioLogadoStr) {
        const usuario = JSON.parse(usuarioLogadoStr);
        entrarNoJogo(usuario);
    }
};