<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $quarto_id = $_GET['quarto_id'] ?? null;
        
        if (!$quarto_id) {
            throw new Exception('ID do quarto não informado');
        }

        $sql = "
            SELECT 
                c.*,
                q.numero as quarto_numero,
                t.nome as titular_nome,
                t.cpf as titular_cpf
            FROM checkins c
            JOIN quartos q ON q.id = c.quarto_id
            JOIN cadastros t ON t.id = c.titular_id
            WHERE c.quarto_id = ? 
            AND c.status = 'ativo'
            ORDER BY c.data_checkin DESC
            LIMIT 1
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$quarto_id]);
        $checkin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$checkin) {
            throw new Exception('Nenhuma hospedagem ativa encontrada');
        }

        // Buscar acompanhantes
        $stmt = $pdo->prepare("
            SELECT c.nome, c.cpf
            FROM checkin_acompanhantes ca
            JOIN cadastros c ON c.id = ca.cadastro_id
            WHERE ca.checkin_id = ?
        ");
        $stmt->execute([$checkin['id']]);
        $checkin['acompanhantes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($checkin);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => $e->getMessage()
        ]);
        exit;
    }
}

try {
    // Log do input recebido
    $input = file_get_contents('php://input');
    error_log('Input recebido: ' . $input);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método não permitido');
    }

    $dados = json_decode($input, true);
    
    // Log dos dados decodificados
    error_log('Dados decodificados: ' . print_r($dados, true));

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Erro ao decodificar JSON: ' . json_last_error_msg());
    }

    if (!$dados) {
        throw new Exception('Dados inválidos');
    }

    // Verificar a action
    $action = $dados['action'] ?? '';

    switch($action) {
        case 'create':
            // Validar dados obrigatórios
            $camposObrigatorios = ['quarto_id', 'titular_id', 'data_checkin', 'data_checkout_previsto', 'valor_total'];
            foreach ($camposObrigatorios as $campo) {
                if (!isset($dados[$campo]) || $dados[$campo] === '') {
                    throw new Exception("Campo obrigatório não informado: {$campo}");
                }
            }

            // Iniciar transação
            $pdo->beginTransaction();

            try {
                // Verificar se o quarto está disponível
                $stmt = $pdo->prepare("SELECT status FROM quartos WHERE id = ?");
                $stmt->execute([$dados['quarto_id']]);
                $quarto = $stmt->fetch();

                if (!$quarto || $quarto['status'] !== 'disponivel') {
                    throw new Exception('Quarto não está disponível');
                }

                // Inserir check-in
                $stmt = $pdo->prepare("
                    INSERT INTO checkins (
                        quarto_id, 
                        titular_id, 
                        data_checkin, 
                        data_checkout_previsto, 
                        valor_total, 
                        desconto,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, 'ativo')
                ");
                
                $stmt->execute([
                    $dados['quarto_id'],
                    $dados['titular_id'],
                    $dados['data_checkin'],
                    $dados['data_checkout_previsto'],
                    $dados['valor_total'],
                    $dados['desconto'] ?? 0
                ]);

                $checkinId = $pdo->lastInsertId();

                // Inserir acompanhantes
                if (!empty($dados['acompanhantes'])) {
                    $stmt = $pdo->prepare("
                        INSERT INTO checkin_acompanhantes (checkin_id, cadastro_id) 
                        VALUES (?, ?)
                    ");

                    foreach ($dados['acompanhantes'] as $acompanhanteId) {
                        $stmt->execute([$checkinId, $acompanhanteId]);
                    }
                }

                // Atualizar status do quarto para ocupado
                $stmt = $pdo->prepare("
                    UPDATE quartos 
                    SET status = 'ocupado' 
                    WHERE id = ?
                ");
                $stmt->execute([$dados['quarto_id']]);

                // Criar registro de pagamento
                $stmt = $pdo->prepare("
                    INSERT INTO pagamentos_quartos 
                    (checkin_id, valor, forma_pagamento, data_pagamento, status)
                    VALUES (?, ?, ?, NOW(), 'pendente')
                ");
                $stmt->execute([
                    $checkinId,
                    $dados['valor_total'],
                    $dados['forma_pagamento'] ?? 'dinheiro'
                ]);

                $pdo->commit();
                echo json_encode([
                    'success' => true,
                    'message' => 'Check-in realizado com sucesso',
                    'checkin_id' => $checkinId
                ]);

            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        case 'checkout':
            // Iniciar transação
            $pdo->beginTransaction();
            
            try {
                // Buscar o check-in e o quarto
                $stmt = $pdo->prepare("
                    SELECT quarto_id 
                    FROM checkins 
                    WHERE id = ? AND status = 'ativo'
                ");
                $stmt->execute([$dados['checkin_id']]);
                $checkin = $stmt->fetch();

                if (!$checkin) {
                    throw new Exception('Check-in não encontrado ou já finalizado');
                }

                // Atualizar status do check-in
                $stmt = $pdo->prepare("
                    UPDATE checkins 
                    SET status = 'finalizado',
                        data_checkout_real = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$dados['checkin_id']]);

                // Marcar quarto como sujo
                $stmt = $pdo->prepare("
                    UPDATE quartos 
                    SET status = 'sujo' 
                    WHERE id = ?
                ");
                $stmt->execute([$checkin['quarto_id']]);

                $pdo->commit();
                echo json_encode(['success' => true]);

            } catch (Exception $e) {
                $pdo->rollBack();
                error_log('Erro no check-out: ' . $e->getMessage());
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
            break;

        default:
            throw new Exception('Ação não reconhecida');
    }

} catch (Exception $e) {
    error_log('Erro no check-in: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 