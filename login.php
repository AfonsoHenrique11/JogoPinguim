<?php
// login.php
header('Content-Type: application/json');

// Configurações do Banco de Dados
$host = 'localhost';
$db   = 'jogo_pinguim';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro de conexão com o banco de dados.']);
    exit;
}

// Pega os dados enviados via AJAX (JSON)
$dados = json_decode(file_get_contents('php://input'), true);

if ($dados && isset($dados['nome'], $dados['senha'])) {
    $nome = $dados['nome'];
    $senha = $dados['senha'];

    // Busca o usuário no banco de dados MySQL
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nome = ?");
    $stmt->execute([$nome]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verifica se o usuário existe e se a senha confere
    if ($usuario && password_verify($senha, $usuario['senha'])) {
        // Sucesso
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Login realizado com sucesso!'
        ]);
    } else {
        // Falha
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Nome de usuário ou senha incorretos.'
        ]);
    }
} else {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Dados incompletos.'
    ]);
}
?>