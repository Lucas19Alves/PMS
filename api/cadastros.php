<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';
header('Content-Type: application/json');

try {
    switch($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM cadastros WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode($stmt->fetch());
            } else {
                $stmt = $pdo->query("SELECT * FROM cadastros ORDER BY nome");
                echo json_encode($stmt->fetchAll());
            }
            break;
        ;

        case 'POST':
            $action = isset($_POST['action']) ? $_POST['action'] : '';
            
            switch($action) {
                case 'delete':
                    $stmt = $pdo->prepare("DELETE FROM cadastros WHERE id = ?");
                    $stmt->execute([$_POST['id']]);
                    echo json_encode(['success' => true]);
                    break;

                case 'update':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("
                        UPDATE cadastros 
                        SET nome = ?, cpf = ?, data_nascimento = ?, telefone = ?, cidade = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['nome'],
                        $data['cpf'],
                        $data['data_nascimento'],
                        $data['telefone'],
                        $data['cidade'],
                        $data['id']
                    ]);
                    echo json_encode(['success' => true]);
                    break;

                case 'create':
                default:
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("
                        INSERT INTO cadastros (nome, cpf, data_nascimento, telefone, cidade) 
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['nome'],
                        $data['cpf'],
                        $data['data_nascimento'],
                        $data['telefone'],
                        $data['cidade']
                    ]);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                    break;
            }
            break;
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 