<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
header('Content-Type: application/json');

// Log para debug
file_put_contents('debug.log', print_r($_POST, true));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Pegar dados do formulário
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    // Verificar credenciais
    if ($username === 'everton' && $password === '7532') {
        $_SESSION['admin_logado'] = true;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos']);
    }
    exit;
}

// Verificar se está logado
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['logado' => isset($_SESSION['admin_logado']) && $_SESSION['admin_logado'] === true]);
    exit;
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}
?> 