const formUsuario = document.getElementById('form-usuario');
const secaoLogin = document.getElementById('secao-login');
const secaoJogo = document.getElementById('secao-jogo');
const saudacao = document.getElementById('saudacao');
const mensagemAlerta = document.getElementById('mensagem-alerta');

// Evento de envio do formulário via AJAX
formUsuario.addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o recarregamento padrão da página

    const nome = document.getElementById('usuario-nome').value.trim();
    const senha = document.getElementById('usuario-senha').value.trim();

    if (!nome || !senha) {
        mensagemAlerta.style.color = '#dc2626';
        mensagemAlerta.innerText = "Preencha todos os campos!";
        return;
    }

    try {
        // Requisição AJAX utilizando fetch para o back-end (ex: PHP)
        const respostaServidor = await fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, senha })
        });

        const resultado = await respostaServidor.json();

        if (resultado.sucesso) {
            // Sucesso! O servidor validou o login
            mensagemAlerta.style.color = '#16a34a';
            mensagemAlerta.innerText = resultado.mensagem;

            // Salva o nome no navegador para manter a UI atualizada se atualizar a página
            localStorage.setItem('pinguim_logado', nome);

            // Alterna os painéis na tela de forma fluida (sem recarregar)
            setTimeout(() => {
                secaoLogin.style.display = 'none';
                secaoJogo.style.display = 'block';
                saudacao.innerText = `Olá, ${nome}! Pronto para jogar?`;
            }, 800);

        } else {
            // Erro retornado pelo servidor (senha incorreta, usuário não existe, etc.)
            mensagemAlerta.style.color = '#dc2626';
            mensagemAlerta.innerText = resultado.mensagem;
        }

    } catch (erro) {
        console.error('Erro na requisição AJAX:', erro);
        mensagemAlerta.style.color = '#dc2626';
        mensagemAlerta.innerText = "Erro de conexão com o servidor.";
    }
});

// Função para sair da conta
function fazerLogout() {
    localStorage.removeItem('pinguim_logado');
    location.reload();
}

// Verifica se já existe uma sessão ativa ao abrir a página de login
window.onload = function() {
    const usuarioLogado = localStorage.getItem('pinguim_logado');
    if (usuarioLogado) {
        secaoLogin.style.display = 'none';
        secaoJogo.style.display = 'block';
        saudacao.innerText = `Olá, ${usuarioLogado}! Pronto para jogar?`;
    }
};