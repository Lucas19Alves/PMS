<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log para debug
file_put_contents('debug.log', print_r($_SERVER, true));

require_once '../config/database.php';

// Verificar conexão com banco
try {
    $stmt = $pdo->query("SELECT 1");
} catch(PDOException $e) {
    error_log('Erro de conexão: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com o banco de dados']);
    exit;
}

// Adicionar headers para CORS e métodos permitidos
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tratar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM quartos ORDER BY numero");
            echo json_encode($stmt->fetchAll());
            break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $action = isset($data['action']) ? $data['action'] : '';
            
                switch($action) {
                    case 'update_status':
                        // Atualizar status
                        $stmt = $pdo->prepare("UPDATE quartos SET status = ? WHERE id = ?");
                        $stmt->execute([$data['status'], $data['id']]);
                        echo json_encode(['success' => true]);
                        break;
            
                    case 'delete':
                        try {
                            // Primeiro verifica se há reservas associadas
                            $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservas WHERE quarto_id = ?");
                            $stmt->execute([$data['id']]);
                            $count = $stmt->fetchColumn();
            
                            if ($count > 0) {
                                throw new Exception("Não é possível excluir um quarto com reservas associadas.");
                            }
            
                            // Excluir o quarto se não houver reservas
                            $stmt = $pdo->prepare("DELETE FROM quartos WHERE id = ?");
                            $stmt->execute([$data['id']]);
                            echo json_encode(['success' => true]);
                        } catch (Exception $e) {
                            http_response_code(400);
                            echo json_encode(['error' => $e->getMessage()]);
                        }
                        break;
            
                    case 'update':
                        // Atualizar quarto
                        $stmt = $pdo->prepare("
                            UPDATE quartos 
                            SET numero = ?, tipo = ?, capacidade = ?, preco_diaria = ?
                            WHERE id = ?
                        ");
                        $stmt->execute([
                            $data['numero'],
                            $data['tipo'],
                            $data['capacidade'],
                            $data['preco_diaria'],
                            $data['id']
                        ]);
                        echo json_encode(['success' => true]);
                        break;
            
                    case 'create':
                    default:
                        // Criar novo quarto
                        $stmt = $pdo->prepare("
                            INSERT INTO quartos (numero, tipo, capacidade, preco_diaria) 
                            VALUES (?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $data['numero'],
                            $data['tipo'],
                            $data['capacidade'],
                            $data['preco_diaria']
                        ]);
                        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                        break;
                }
                break;
            

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
            break;
    }
} catch(Exception $e) {
    error_log('Erro: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 