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

    if (empty($nome) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos.']);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, senha) VALUES (?, ?)");
        $stmt->execute([$nome, $senhaHash]);
        
        echo json_encode(['sucesso' => true, 'mensagem' => 'Conta criada com sucesso! Faça login.']);
    } catch (PDOException $e) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Este nome de usuário já está em uso.']);
    }
} else {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados incompletos.']);
}
?>