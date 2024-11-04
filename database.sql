CREATE DATABASE hotel_minas_bahia;
USE hotel_minas_bahia;

CREATE TABLE quartos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(10) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    capacidade INT NOT NULL,
    preco_diaria DECIMAL(10,2) NOT NULL,
    status ENUM('disponivel', 'ocupado', 'sujo', 'manutencao') DEFAULT 'disponivel',
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospedes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(100),
    endereco TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quarto_id INT,
    hospede_id INT,
    data_checkin DATE NOT NULL,
    data_checkout DATE NOT NULL,
    status ENUM('confirmada', 'checkin', 'checkout', 'cancelada') DEFAULT 'confirmada',
    valor_total DECIMAL(10,2) NOT NULL,
    observacoes TEXT,
    FOREIGN KEY (quarto_id) REFERENCES quartos(id),
    FOREIGN KEY (hospede_id) REFERENCES hospedes(id)
);

CREATE TABLE movimentacao_caixa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT,
    tipo ENUM('entrada', 'saida') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);
