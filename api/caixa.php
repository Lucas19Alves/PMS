<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Funções auxiliares
function calcularSaldoAtual($pdo) {
    $stmt = $pdo->query("
        SELECT 
            COALESCE(c.valor_inicial, 0) + 
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END), 0) as saldo
        FROM caixa_controle c
        LEFT JOIN caixa_movimentacoes m ON c.id = m.caixa_controle_id
        WHERE c.status = 'aberto'
        GROUP BY c.id
        ORDER BY c.data_abertura DESC
        LIMIT 1
    ");
    return floatval($stmt->fetchColumn() ?? 0);
}

function calcularEntradasHoje($pdo) {
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(valor), 0) as total
        FROM caixa_movimentacoes
        WHERE tipo = 'entrada'
        AND DATE(data_hora) = CURRENT_DATE
        AND caixa_controle_id = (
            SELECT id FROM caixa_controle 
            WHERE status = 'aberto' 
            ORDER BY data_abertura DESC 
            LIMIT 1
        )
    ");
    return floatval($stmt->fetchColumn());
}

function calcularSaidasHoje($pdo) {
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(valor), 0) as total
        FROM caixa_movimentacoes
        WHERE tipo = 'saida'
        AND DATE(data_hora) = CURRENT_DATE
        AND caixa_controle_id = (
            SELECT id FROM caixa_controle 
            WHERE status = 'aberto' 
            ORDER BY data_abertura DESC 
            LIMIT 1
        )
    ");
    return floatval($stmt->fetchColumn());
}

function getMovimentacoes($pdo) {
    $stmt = $pdo->query("
        SELECT *
        FROM caixa_movimentacoes
        WHERE caixa_controle_id = (
            SELECT id FROM caixa_controle 
            WHERE status = 'aberto' 
            ORDER BY data_abertura DESC 
            LIMIT 1
        )
        ORDER BY data_hora DESC
        LIMIT 10
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getDadosGraficos($pdo) {
    // Dados para gráfico de movimentações por hora
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(data_hora, '%H:00') as hora,
            SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
            SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as saidas
        FROM caixa_movimentacoes
        WHERE DATE(data_hora) = CURRENT_DATE
        AND caixa_controle_id = (
            SELECT id FROM caixa_controle 
            WHERE status = 'aberto' 
            ORDER BY data_abertura DESC 
            LIMIT 1
        )
        GROUP BY hora
        ORDER BY hora
    ");
    $movimentacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Dados para gráfico de formas de pagamento
    $stmt = $pdo->query("
        SELECT 
            forma_pagamento,
            COUNT(*) as quantidade,
            SUM(valor) as total
        FROM caixa_movimentacoes
        WHERE tipo = 'entrada'
        AND caixa_controle_id = (
            SELECT id FROM caixa_controle 
            WHERE status = 'aberto' 
            ORDER BY data_abertura DESC 
            LIMIT 1
        )
        GROUP BY forma_pagamento
    ");
    $formasPagamento = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'movimentacoes' => [
            'labels' => array_column($movimentacoes, 'hora'),
            'entradas' => array_column($movimentacoes, 'entradas'),
            'saidas' => array_column($movimentacoes, 'saidas')
        ],
        'formas_pagamento' => [
            'labels' => array_column($formasPagamento, 'forma_pagamento'),
            'valores' => array_column($formasPagamento, 'total')
        ]
    ];
}

try {
    switch($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $action = $_GET['action'] ?? '';
            
            switch($action) {
                case 'status':
                    $stmt = $pdo->query("
                        SELECT * FROM caixa_controle 
                        WHERE status = 'aberto' 
                        ORDER BY data_abertura DESC 
                        LIMIT 1
                    ");
                    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'status' => $caixa ? 'aberto' : 'fechado',
                        'caixa' => $caixa
                    ]);
                    break;

                case 'dashboard':
                    echo json_encode([
                        'saldo_atual' => calcularSaldoAtual($pdo),
                        'entradas_hoje' => calcularEntradasHoje($pdo),
                        'saidas_hoje' => calcularSaidasHoje($pdo)
                    ]);
                    break;

                case 'graficos':
                    echo json_encode(getDadosGraficos($pdo));
                    break;

                case 'movimentacoes':
                    echo json_encode(getMovimentacoes($pdo));
                    break;

                default:
                    throw new Exception('Ação não reconhecida');
            }
            break;

        case 'POST':
            // Ler o corpo da requisição como JSON
            $jsonData = file_get_contents('php://input');
            $dados = json_decode($jsonData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Dados JSON inválidos: ' . json_last_error_msg());
            }

            if (!isset($dados['action'])) {
                throw new Exception('Ação não especificada');
            }

            switch($dados['action']) {
                case 'abrir':
                    if (!isset($dados['valor_inicial'])) {
                        throw new Exception('Valor inicial não especificado');
                    }

                    // Verificar se já existe um caixa aberto
                    $stmt = $pdo->query("
                        SELECT id FROM caixa_controle 
                        WHERE status = 'aberto'
                    ");
                    if ($stmt->fetch()) {
                        throw new Exception('Já existe um caixa aberto');
                    }

                    // Inserir novo caixa
                    $stmt = $pdo->prepare("
                        INSERT INTO caixa_controle 
                        (data_abertura, valor_inicial, status, observacoes, usuario_id)
                        VALUES (NOW(), ?, 'aberto', ?, ?)
                    ");
                    
                    $stmt->execute([
                        floatval($dados['valor_inicial']),
                        $dados['observacoes'] ?? '',
                        $dados['usuario_id']
                    ]);

                    echo json_encode(['success' => true]);
                    break;

                case 'fechar':
                    // Buscar caixa aberto
                    $stmt = $pdo->query("
                        SELECT id, valor_inicial FROM caixa_controle 
                        WHERE status = 'aberto'
                        ORDER BY data_abertura DESC 
                        LIMIT 1
                    ");
                    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$caixa) {
                        throw new Exception('Não há caixa aberto');
                    }

                    // Atualizar caixa
                    $stmt = $pdo->prepare("
                        UPDATE caixa_controle 
                        SET status = 'fechado',
                            data_fechamento = NOW(),
                            valor_final = ?,
                            valor_diferenca = ? - (
                                valor_inicial + COALESCE(
                                    (SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END)
                                     FROM caixa_movimentacoes 
                                     WHERE caixa_controle_id = ?),
                                    0
                                )
                            )
                        WHERE id = ?
                    ");
                    
                    $stmt->execute([
                        floatval($dados['valor_final']),
                        floatval($dados['valor_final']),
                        $caixa['id'],
                        $caixa['id']
                    ]);

                    echo json_encode(['success' => true]);
                    break;

                case 'movimentacao':
                    // Buscar caixa aberto
                    $stmt = $pdo->query("
                        SELECT id FROM caixa_controle 
                        WHERE status = 'aberto'
                        ORDER BY data_abertura DESC 
                        LIMIT 1
                    ");
                    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$caixa) {
                        throw new Exception('Não há caixa aberto');
                    }

                    // Inserir movimentação
                    $stmt = $pdo->prepare("
                        INSERT INTO caixa_movimentacoes 
                        (caixa_controle_id, tipo, categoria, descricao, valor, forma_pagamento, data_hora)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ");
                    
                    $stmt->execute([
                        $caixa['id'],
                        $dados['tipo'],
                        $dados['categoria'],
                        $dados['descricao'],
                        floatval($dados['valor']),
                        $dados['forma_pagamento']
                    ]);

                    echo json_encode(['success' => true]);
                    break;

                default:
                    throw new Exception('Ação não reconhecida');
            }
            break;

        default:
            throw new Exception('Método não permitido');
    }
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
