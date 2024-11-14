<?php
require_once '../config/database.php';

// Remover headers de PDF
header('Content-Type: text/html; charset=utf-8');

function getMovimentacoesDiarias($data = null) {
    global $pdo;
    $data = $data ?? date('Y-m-d');
    
    $stmt = $pdo->prepare("
        SELECT 
            m.*,
            c.data_abertura,
            c.data_fechamento,
            c.valor_inicial,
            c.valor_final
        FROM caixa_movimentacoes m
        JOIN caixa_controle c ON m.caixa_controle_id = c.id
        WHERE DATE(m.data_hora) = ?
        ORDER BY m.data_hora
    ");
    $stmt->execute([$data]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$tipo = $_GET['tipo'] ?? '';
$data = $_GET['data'] ?? date('Y-m-d');
$movimentacoes = getMovimentacoesDiarias($data);

// Calcular totais
$totalEntradas = 0;
$totalSaidas = 0;
foreach ($movimentacoes as $mov) {
    if ($mov['tipo'] === 'entrada') {
        $totalEntradas += $mov['valor'];
    } else {
        $totalSaidas += $mov['valor'];
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Caixa - <?= date('d/m/Y', strtotime($data)) ?></title>
    <style>
        @media print {
            .no-print {
                display: none;
            }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .totais {
            margin-top: 20px;
        }
        .print-button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <button onclick="window.print()" class="print-button no-print">Imprimir Relatório</button>
    
    <div class="header">
        <h1>Hotel Minas Bahia</h1>
        <h2>Relatório de Caixa - <?= date('d/m/Y', strtotime($data)) ?></h2>
    </div>

    <table>
        <thead>
            <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Forma Pagamento</th>
                <th>Valor</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($movimentacoes as $mov): ?>
            <tr>
                <td><?= date('H:i', strtotime($mov['data_hora'])) ?></td>
                <td><?= ucfirst($mov['tipo']) ?></td>
                <td><?= ucfirst($mov['categoria']) ?></td>
                <td><?= ucfirst($mov['forma_pagamento']) ?></td>
                <td>R$ <?= number_format($mov['valor'], 2, ',', '.') ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <div class="totais">
        <p><strong>Total de Entradas:</strong> R$ <?= number_format($totalEntradas, 2, ',', '.') ?></p>
        <p><strong>Total de Saídas:</strong> R$ <?= number_format($totalSaidas, 2, ',', '.') ?></p>
        <p><strong>Saldo do Dia:</strong> R$ <?= number_format($totalEntradas - $totalSaidas, 2, ',', '.') ?></p>
    </div>
</body>
</html>
