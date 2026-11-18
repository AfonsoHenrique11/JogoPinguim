<?php
header('Content-Type: application/json');

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

$dados = json_decode(file_get_contents('php://input'), true);

if ($dados && isset($dados['nome'], $dados['senha'])) {
    $nome = trim($dados['nome']);
    $senha = trim($dados['senha']);

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nome = ?");
    $stmt->execute([$nome]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        // Retorna sucesso e o nome oficial cadastrado no banco
        echo json_encode([
            'sucesso' => true, 
            'mensagem' => 'Login realizado com sucesso!',
            'nome' => $usuario['nome']
        ]);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Nome de usuário ou senha incorretos.']);
    }
} else {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados incompletos.']);
}
?>