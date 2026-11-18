const formUsuario = document.getElementById('form-usuario');
const formCadastro = document.getElementById('form-cadastro');
const secaoLogin = document.getElementById('secao-login');
const secaoCadastro = document.getElementById('secao-cadastro');
const btnMostrarCadastro = document.getElementById('btn-mostrar-cadastro');
const btnVoltarLogin = document.getElementById('btn-voltar-login');
const mensagemAlerta = document.getElementById('mensagem-alerta');

// Alternar entre telas de Login e Cadastro
if (btnMostrarCadastro && btnVoltarLogin) {
    btnMostrarCadastro.addEventListener('click', () => {
        secaoLogin.style.display = 'none';
        secaoCadastro.style.display = 'block';
        mensagemAlerta.innerText = '';
    });

    btnVoltarLogin.addEventListener('click', () => {
        secaoCadastro.style.display = 'none';
        secaoLogin.style.display = 'block';
        mensagemAlerta.innerText = '';
    });
}

// AJAX para LOGIN
if (formUsuario) {
    formUsuario.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nome = document.getElementById('usuario-nome').value.trim();
        const senha = document.getElementById('usuario-senha').value.trim();

        if (!nome || !senha) {
            mensagemAlerta.style.color = '#dc2626';
            mensagemAlerta.innerText = "Preencha todos os campos!";
            return;
        }

        try {
            const respostaServidor = await fetch('login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, senha })
            });

            const resultado = await respostaServidor.json();

            if (resultado.sucesso) {
                mensagemAlerta.style.color = '#16a34a';
                mensagemAlerta.innerText = resultado.mensagem;
                localStorage.setItem('pinguim_logado', nome);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                mensagemAlerta.style.color = '#dc2626';
                mensagemAlerta.innerText = resultado.mensagem;
            }
        } catch (erro) {
            console.error('Erro no AJAX de login:', erro);
            mensagemAlerta.style.color = '#dc2626';
            mensagemAlerta.innerText = "Erro de conexão com o servidor.";
        }
    });
}

// AJAX para CADASTRO
if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value.trim();
        const senha = document.getElementById('cad-senha').value.trim();

        if (!nome || !senha) {
            mensagemAlerta.style.color = '#dc2626';
            mensagemAlerta.innerText = "Preencha todos os campos para cadastrar!";
            return;
        }

        try {
            const respostaServidor = await fetch('cadastrar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, senha })
            });

            const resultado = await respostaServidor.json();

            if (resultado.sucesso) {
                mensagemAlerta.style.color = '#16a34a';
                mensagemAlerta.innerText = resultado.mensagem;
                // Volta para a tela de login automaticamente após o sucesso
                setTimeout(() => {
                    secaoCadastro.style.display = 'none';
                    secaoLogin.style.display = 'block';
                    mensagemAlerta.innerText = '';
                    document.getElementById('usuario-nome').value = nome;
                }, 1500);
            } else {
                mensagemAlerta.style.color = '#dc2626';
                mensagemAlerta.innerText = resultado.mensagem;
            }
        } catch (erro) {
            console.error('Erro no AJAX de cadastro:', erro);
            mensagemAlerta.style.color = '#dc2626';
            mensagemAlerta.innerText = "Erro de conexão com o servidor.";
        }
    });
}
if (resultado.sucesso) {
                mensagemAlerta.style.color = '#16a34a';
                mensagemAlerta.innerText = resultado.mensagem;
                
                // Salva o usuário logado no navegador
                localStorage.setItem('pinguim_logado', resultado.nome);

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }