-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           8.0.30 - MySQL Community Server - GPL
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para hotel_minas_bahia
CREATE DATABASE IF NOT EXISTS `hotel_minas_bahia` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hotel_minas_bahia`;

-- Copiando estrutura para tabela hotel_minas_bahia.cadastros
CREATE TABLE IF NOT EXISTS `cadastros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `data_nascimento` date NOT NULL,
  `telefone` varchar(15) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `data_cadastro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.cadastros: ~3 rows (aproximadamente)
DELETE FROM `cadastros`;
INSERT INTO `cadastros` (`id`, `nome`, `cpf`, `data_nascimento`, `telefone`, `cidade`, `data_cadastro`) VALUES
	(1, 'João Silva', '123.456.789-00', '1990-01-15', '(31) 99999-9999', 'Belo Horizonte', '2024-11-04 22:06:06'),
	(2, 'Maria Santos', '987.654.321-00', '1985-05-20', '(31) 98888-8888', 'Contagem', '2024-11-04 22:06:06'),
	(3, 'Lucas Pereira Alves', '402.897.768-13', '2000-05-12', '(77) 99115-6978', 'Mortugaba', '2024-11-04 22:06:38');

-- Copiando estrutura para tabela hotel_minas_bahia.caixa_controle
CREATE TABLE IF NOT EXISTS `caixa_controle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_abertura` datetime NOT NULL,
  `data_fechamento` datetime DEFAULT NULL,
  `valor_inicial` decimal(10,2) NOT NULL,
  `valor_final` decimal(10,2) DEFAULT NULL,
  `valor_diferenca` decimal(10,2) DEFAULT NULL,
  `status` enum('aberto','fechado') NOT NULL,
  `observacoes` text,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.caixa_controle: ~2 rows (aproximadamente)
DELETE FROM `caixa_controle`;
INSERT INTO `caixa_controle` (`id`, `data_abertura`, `data_fechamento`, `valor_inicial`, `valor_final`, `valor_diferenca`, `status`, `observacoes`, `usuario_id`) VALUES
	(1, '2024-11-14 15:06:53', '2024-11-14 15:07:21', 0.00, 0.00, 0.00, 'fechado', '', 1),
	(2, '2024-11-14 15:13:43', '2024-11-14 15:15:06', 0.00, 100.00, 0.00, 'fechado', '', 1);

-- Copiando estrutura para tabela hotel_minas_bahia.caixa_movimentacoes
CREATE TABLE IF NOT EXISTS `caixa_movimentacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caixa_controle_id` int NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `descricao` text NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `forma_pagamento` varchar(50) NOT NULL,
  `data_hora` datetime NOT NULL,
  `referencia_id` int DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `caixa_controle_id` (`caixa_controle_id`),
  CONSTRAINT `caixa_movimentacoes_ibfk_1` FOREIGN KEY (`caixa_controle_id`) REFERENCES `caixa_controle` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.caixa_movimentacoes: ~1 rows (aproximadamente)
DELETE FROM `caixa_movimentacoes`;
INSERT INTO `caixa_movimentacoes` (`id`, `caixa_controle_id`, `tipo`, `categoria`, `descricao`, `valor`, `forma_pagamento`, `data_hora`, `referencia_id`, `referencia_tipo`) VALUES
	(1, 2, 'entrada', 'hospedagem', '102', 100.00, 'dinheiro', '2024-11-14 15:14:02', NULL, NULL);

-- Copiando estrutura para tabela hotel_minas_bahia.checkins
CREATE TABLE IF NOT EXISTS `checkins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quarto_id` int NOT NULL,
  `titular_id` int NOT NULL,
  `data_checkin` datetime NOT NULL,
  `data_checkout_previsto` datetime NOT NULL,
  `data_checkout_real` datetime DEFAULT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00',
  `status` enum('ativo','finalizado','cancelado') DEFAULT 'ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quarto_id` (`quarto_id`),
  KEY `titular_id` (`titular_id`),
  CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`quarto_id`) REFERENCES `quartos` (`id`),
  CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`titular_id`) REFERENCES `cadastros` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.checkins: ~7 rows (aproximadamente)
DELETE FROM `checkins`;
INSERT INTO `checkins` (`id`, `quarto_id`, `titular_id`, `data_checkin`, `data_checkout_previsto`, `data_checkout_real`, `valor_total`, `desconto`, `status`, `created_at`) VALUES
	(1, 8, 3, '2024-11-04 22:41:00', '2024-11-05 20:41:00', '2024-11-04 19:58:21', 110.00, 50.00, 'finalizado', '2024-11-04 22:42:17'),
	(2, 7, 3, '2024-11-04 22:45:00', '2024-11-05 10:00:00', '2024-11-04 19:58:25', 120.00, 0.00, 'finalizado', '2024-11-04 22:46:07'),
	(3, 9, 3, '2024-11-04 22:47:00', '2024-11-05 10:00:00', '2024-11-04 19:53:51', 10000.00, 0.00, 'finalizado', '2024-11-04 22:47:45'),
	(4, 12, 3, '2024-11-04 22:50:00', '2024-11-05 10:00:00', '2024-11-04 19:58:17', 8000.00, 0.00, 'finalizado', '2024-11-04 22:50:45'),
	(5, 12, 3, '2024-11-13 16:58:00', '2024-11-14 12:00:00', '2024-11-13 13:59:47', 16000.00, 0.00, 'finalizado', '2024-11-13 16:59:38'),
	(6, 10, 3, '2024-11-13 17:39:00', '2024-11-14 08:39:00', '2024-11-13 14:40:02', 30000.00, 0.00, 'finalizado', '2024-11-13 17:39:46'),
	(7, 8, 3, '2024-11-14 17:23:00', '2024-11-15 17:23:00', NULL, 16000.00, 0.00, 'ativo', '2024-11-14 17:23:35');

-- Copiando estrutura para tabela hotel_minas_bahia.checkin_acompanhantes
CREATE TABLE IF NOT EXISTS `checkin_acompanhantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `checkin_id` int NOT NULL,
  `cadastro_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `checkin_id` (`checkin_id`),
  KEY `cadastro_id` (`cadastro_id`),
  CONSTRAINT `checkin_acompanhantes_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`),
  CONSTRAINT `checkin_acompanhantes_ibfk_2` FOREIGN KEY (`cadastro_id`) REFERENCES `cadastros` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.checkin_acompanhantes: ~5 rows (aproximadamente)
DELETE FROM `checkin_acompanhantes`;
INSERT INTO `checkin_acompanhantes` (`id`, `checkin_id`, `cadastro_id`) VALUES
	(1, 2, 1),
	(2, 2, 2),
	(3, 5, 1),
	(4, 6, 1),
	(5, 7, 2);

-- Copiando estrutura para tabela hotel_minas_bahia.hospedes
CREATE TABLE IF NOT EXISTS `hospedes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `endereco` text,
  `data_cadastro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.hospedes: ~0 rows (aproximadamente)
DELETE FROM `hospedes`;

-- Copiando estrutura para tabela hotel_minas_bahia.movimentacao_caixa
CREATE TABLE IF NOT EXISTS `movimentacao_caixa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int DEFAULT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `descricao` text,
  `data_movimento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reserva_id` (`reserva_id`),
  CONSTRAINT `movimentacao_caixa_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.movimentacao_caixa: ~0 rows (aproximadamente)
DELETE FROM `movimentacao_caixa`;

-- Copiando estrutura para tabela hotel_minas_bahia.pagamentos_quartos
CREATE TABLE IF NOT EXISTS `pagamentos_quartos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `checkin_id` int NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `forma_pagamento` varchar(50) NOT NULL,
  `data_pagamento` datetime NOT NULL,
  `caixa_movimentacao_id` int DEFAULT NULL,
  `status` enum('pendente','confirmado','cancelado') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `checkin_id` (`checkin_id`),
  KEY `caixa_movimentacao_id` (`caixa_movimentacao_id`),
  CONSTRAINT `pagamentos_quartos_ibfk_1` FOREIGN KEY (`checkin_id`) REFERENCES `checkins` (`id`),
  CONSTRAINT `pagamentos_quartos_ibfk_2` FOREIGN KEY (`caixa_movimentacao_id`) REFERENCES `caixa_movimentacoes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.pagamentos_quartos: ~0 rows (aproximadamente)
DELETE FROM `pagamentos_quartos`;

-- Copiando estrutura para tabela hotel_minas_bahia.quartos
CREATE TABLE IF NOT EXISTS `quartos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) NOT NULL,
  `tipo` enum('Simples','Ventilador com Banheiro','Ar Condicionado','Luxo') NOT NULL,
  `capacidade` int NOT NULL,
  `preco_diaria` decimal(10,2) NOT NULL,
  `status` enum('disponivel','ocupado','sujo','manutencao') DEFAULT 'disponivel',
  `ultima_atualizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.quartos: ~10 rows (aproximadamente)
DELETE FROM `quartos`;
INSERT INTO `quartos` (`id`, `numero`, `tipo`, `capacidade`, `preco_diaria`, `status`, `ultima_atualizacao`) VALUES
	(3, '201', 'Luxo', 1, 200.00, 'disponivel', '2024-11-04 21:46:10'),
	(4, '202', 'Luxo', 2, 250.00, 'disponivel', '2024-11-04 21:46:10'),
	(5, '301', 'Simples', 2, 350.00, 'disponivel', '2024-11-04 21:46:10'),
	(6, '302', 'Simples', 2, 500.00, 'disponivel', '2024-11-04 21:46:10'),
	(7, '101', 'Simples', 5, 40.00, 'sujo', '2024-11-04 22:58:25'),
	(8, '101', 'Simples', 2, 80.00, 'ocupado', '2024-11-14 17:23:35'),
	(9, '102', 'Ventilador com Banheiro', 2, 100.00, 'disponivel', '2024-11-13 17:40:15'),
	(10, '103', 'Ar Condicionado', 2, 150.00, 'disponivel', '2024-11-13 17:40:09'),
	(11, '104', 'Luxo', 2, 200.00, 'disponivel', '2024-11-04 21:46:10'),
	(12, '102', 'Ar Condicionado', 3, 80.00, 'disponivel', '2024-11-13 17:40:11');

-- Copiando estrutura para tabela hotel_minas_bahia.reservas
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quarto_id` int DEFAULT NULL,
  `hospede_id` int DEFAULT NULL,
  `data_checkin` date NOT NULL,
  `data_checkout` date NOT NULL,
  `status` enum('confirmada','checkin','checkout','cancelada') DEFAULT 'confirmada',
  `valor_total` decimal(10,2) NOT NULL,
  `observacoes` text,
  `data_reserva` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quarto_id` (`quarto_id`),
  KEY `hospede_id` (`hospede_id`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`quarto_id`) REFERENCES `quartos` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`hospede_id`) REFERENCES `hospedes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Copiando dados para a tabela hotel_minas_bahia.reservas: ~0 rows (aproximadamente)
DELETE FROM `reservas`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
