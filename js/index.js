let quartosData = [];

// Variáveis globais para check-in
let quartoSelecionado = null;
let acompanhantes = [];
let valorPorPessoa = 0;

async function carregarQuartos() {
    try {
        const response = await fetch('./api/quartos.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        quartosData = await response.json();
        atualizarMapaQuartos();
        atualizarResumo();
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
    }
}

function atualizarMapaQuartos() {
    const container = document.getElementById('mapaQuartos');
    container.innerHTML = quartosData.map(quarto => `
        <div class="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
             onclick="mostrarModalQuarto(${quarto.id})">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-xl font-bold">${quarto.numero}</h3>
                <span class="w-3 h-3 rounded-full ${getStatusColor(quarto.status)}"></span>
            </div>
            <p class="text-gray-600 text-sm mb-2">${quarto.tipo}</p>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">
                    R$ ${quarto.preco_diaria}
                </span>
                <span class="text-sm ${getStatusTextColor(quarto.status)}">
                    ${getStatusText(quarto.status)}
                </span>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const cores = {
        'disponivel': 'bg-green-500',
        'ocupado': 'bg-red-500',
        'sujo': 'bg-yellow-500',
        'manutencao': 'bg-gray-500'
    };
    return cores[status] || 'bg-gray-500';
}

function getStatusTextColor(status) {
    const cores = {
        'disponivel': 'text-green-600',
        'ocupado': 'text-red-600',
        'sujo': 'text-yellow-600',
        'manutencao': 'text-gray-600'
    };
    return cores[status] || 'text-gray-600';
}

function getStatusText(status) {
    const textos = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'sujo': 'Sujo',
        'manutencao': 'Manutenção'
    };
    return textos[status] || status;
}

function atualizarResumo() {
    const total = quartosData.length;
    const ocupados = quartosData.filter(q => q.status === 'ocupado').length;
    const disponiveis = quartosData.filter(q => q.status === 'disponivel').length;
    const sujos = quartosData.filter(q => q.status === 'sujo').length;

    document.getElementById('taxaOcupacao').textContent = `${Math.round((ocupados / total) * 100)}%`;
    document.getElementById('resumoOcupacao').textContent = `${ocupados} de ${total} quartos ocupados`;
    document.getElementById('quartosDisponiveis').textContent = disponiveis;
    document.getElementById('quartosOcupados').textContent = ocupados;
    document.getElementById('quartosSujos').textContent = sujos;
}

function mostrarAcoesRapidas(quartoId) {
    const quarto = quartosData.find(q => q.id === quartoId);
    document.getElementById('quartoNumero').textContent = quarto.numero;
    document.getElementById('acaoRapidaModal').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modalQuarto').classList.add('hidden');
    document.getElementById('modalCadastroRapido').classList.add('hidden');
    document.getElementById('modalPagamentoCheckout').classList.add('hidden');
    document.getElementById('acaoRapidaModal').classList.add('hidden');

    quartoSelecionado = null;
    acompanhantes = [];
    valorPorPessoa = 0;
}

// Atualizar status do quarto
async function atualizarStatusQuarto(quartoId, novoStatus) {
    try {
        const formData = new FormData();
        formData.append('id', quartoId);
        formData.append('status', novoStatus);
        formData.append('action', 'update_status');

        const response = await fetch('./api/quartos.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await carregarQuartos();
        fecharModal();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status do quarto. Tente novamente.');
    }
}

// Carregar quartos ao iniciar a página
carregarQuartos();

// Atualizar a cada 30 segundos
setInterval(carregarQuartos, 30000);

// Funções para gerenciar o modal de quarto
async function mostrarModalQuarto(quartoId) {
    const quarto = quartosData.find(q => q.id === quartoId);
    if (!quarto) return;

    switch (quarto.status) {
        case 'disponivel':
            mostrarModalCheckIn(quarto);
            break;
        case 'ocupado':
            mostrarModalHospedagemAtiva(quarto);
            break;
        case 'sujo':
            mostrarModalQuartoSujo(quarto);
            break;
        default:
            alert('Status do quarto não reconhecido');
    }
}

// Função para mostrar modal de hospedagem ativa
async function mostrarModalHospedagemAtiva(quarto) {
    try {
        const response = await fetch(`./api/checkin.php?quarto_id=${quarto.id}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.message);
        }

        quartoSelecionado = quarto;

        const modalContent = `
            <div class="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-bold">Quarto ${quarto.numero} - Hospedagem Ativa</h3>
                    <button onclick="fecharModal()" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-6">
                    <!-- Informações da Hospedagem -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">Informações da Hospedagem</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">Check-in:</p>
                                <p class="font-medium">${formatarDataHora(data.data_checkin)}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Check-out Previsto:</p>
                                <p class="font-medium">${formatarDataHora(data.data_checkout_previsto)}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Valor Total:</p>
                                <p class="font-medium">R$ ${parseFloat(data.valor_total).toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Desconto Aplicado:</p>
                                <p class="font-medium">R$ ${parseFloat(data.desconto).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Informações do Titular -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">Titular</h4>
                        <p class="font-medium">${data.titular_nome}</p>
                        <p class="text-sm text-gray-600">CPF: ${data.titular_cpf}</p>
                    </div>

                    ${data.acompanhantes.length ? `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold mb-2">Acompanhantes</h4>
                            <ul class="space-y-2">
                                ${data.acompanhantes.map(acomp => `
                                    <li class="text-sm">
                                        <span class="font-medium">${acomp.nome}</span>
                                        <span class="text-gray-600"> - CPF: ${acomp.cpf}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <!-- Botões -->
                    <div class="flex justify-end space-x-2 pt-4">
                        <button onclick="fecharModal()" 
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Fechar
                        </button>
                        <button onclick="iniciarCheckout(quartoSelecionado)" class="w-full bg-red-600 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-sign-out-alt mr-2"></i>Check-out
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.getElementById('modalQuarto');
        modalContainer.innerHTML = modalContent;
        modalContainer.classList.remove('hidden');

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados da hospedagem: ' + error.message);
        fecharModal();
    }
}

// Função para verificar status de ocupação do quarto
async function verificarOcupacao(quartoId) {
    try {
        const response = await fetch(`./api/checkin.php?action=verificar_ocupacao&quarto_id=${quartoId}`);
        const data = await response.json();
        console.log('Resposta da verificação de ocupação:', data);
        return data.ocupado === true;
    } catch (error) {
        console.error('Erro ao verificar ocupação:', error);
        return false;
    }
}

 async function iniciarCheckout(quarto) {
     if (!quarto) {
         alert('Erro: Quarto não selecionado');
         return;
     }

     // Verifica se o caixa está aberto
     const caixaAberto = await verificarStatusCaixa();
     if (!caixaAberto) {
         mostrarModalCaixaFechado();
         return;
     }

     // Verifica se o quarto está ocupado
     const ocupacaoResult = await verificarOcupacao(quarto.id);
     console.log('Resultado da verificação de ocupação:', ocupacaoResult);

     if (!ocupacaoResult.ocupado) {
         alert(`Este quarto não está ocupado. Detalhes: ${JSON.stringify(ocupacaoResult.debug_info)}`);
         return;
     }

     try {
         // Busca os dados da hospedagem atual
         // ... (resto do código)
     } catch (error) {
         console.error('Erro ao iniciar checkout:', error);
         alert('Erro ao iniciar o processo de checkout. Por favor, tente novamente.');
     }
 }

// Função para mostrar modal de pagamento do check-out
function mostrarModalPagamentoCheckout(hospedagem) {
    const valorTotal = parseFloat(hospedagem.valor_total);
    const valorJaPago = parseFloat(hospedagem.valor_pago) || 0;
    const saldoAPagar = valorTotal - valorJaPago;

    const modalContent = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Check-out ${hospedagem.numero_quarto ? `- Quarto ${hospedagem.numero_quarto}` : ''}</h3>
                <button onclick="fecharModalPagamentoCheckout()" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <h4 class="font-semibold mb-2">Informações da Hospedagem</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="block text-gray-600">Check-in:</span>
                        <span class="font-medium">${new Date(hospedagem.data_checkin).toLocaleString()}</span>
                    </div>
                    <div>
                        <span class="block text-gray-600">Check-out:</span>
                        <span class="font-medium">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <form id="formPagamentoCheckout" onsubmit="finalizarCheckout(event, ${hospedagem.id})" class="space-y-4">
                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-4">Resumo Financeiro</h4>

                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Valor Total</label>
                            <input type="text" value="${formatarMoeda(valorTotal)}" readonly
                                class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Valor Já Pago</label>
                            <input type="text" value="${formatarMoeda(valorJaPago)}" readonly
                                class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Saldo a Pagar</label>
                            <input type="text" value="${formatarMoeda(saldoAPagar)}" readonly
                                class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm font-bold text-lg">
                        </div>
                    </div>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-4">Pagamento</h4>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                            <select id="formaPagamentoCheckout" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="dinheiro">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="cartao_credito">Cartão de Crédito</option>
                                <option value="cartao_debito">Cartão de Débito</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Valor do Pagamento</label>
                            <input type="number" 
                                   id="valorPagamentoCheckout" 
                                   required 
                                   min="0" 
                                   max="${saldoAPagar}"
                                   step="0.01"
                                   value="${saldoAPagar}"
                                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                   oninput="formatarInputMonetario(this)">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" onclick="fecharModalPagamentoCheckout()"
                        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Confirmar Check-out
                    </button>
                </div>
            </form>
        </div>
    `;

    const modalContainer = document.getElementById('modalPagamentoCheckout');
    modalContainer.innerHTML = modalContent;
    modalContainer.classList.remove('hidden');
}

function fecharModalPagamentoCheckout() {
    const modalContainer = document.getElementById('modalPagamentoCheckout');
    modalContainer.classList.add('hidden');
}


// Função para finalizar check-out
async function finalizarCheckout(event, checkinId) {
    event.preventDefault();

    const valorPagamento = parseFloat(document.getElementById('valorPagamentoCheckout').value) || 0;
    const formaPagamento = document.getElementById('formaPagamentoCheckout').value;

    try {
        // Registrar pagamento no caixa
        if (valorPagamento > 0) {
            let descricao = 'Hospedagem - Check-out';
            if (quartoSelecionado && quartoSelecionado.numero) {
                descricao += ` Quarto ${quartoSelecionado.numero}`;
            }
            await registrarPagamentoCaixa(
                'entrada',
                valorPagamento,
                formaPagamento,
                descricao
            );
        }

        // Finalizar check-out
        const response = await fetch('./api/checkin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'checkout',
                checkin_id: checkinId,
                pagamento: {
                    valor: valorPagamento,
                    forma_pagamento: formaPagamento
                }
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Check-out realizado com sucesso!');
            fecharModalPagamentoCheckout();
            window.location.reload();
        } else {
            throw new Error(result.message || 'Erro ao realizar check-out');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao finalizar check-out: ' + error.message);
    }
}

function fecharModalPagamentoCheckout() {
    const modalContainer = document.getElementById('modalPagamentoCheckout');
    modalContainer.classList.add('hidden');
}

// Modal para quarto sujo
function mostrarModalQuartoSujo(quarto) {
    const modalContent = `
        <div class="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Quarto ${quarto.numero} - Aguardando Limpeza</h3>
                <button onclick="fecharModal()" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="text-center py-4">
                <i class="fas fa-broom text-yellow-500 text-4xl mb-4"></i>
                <p class="text-gray-600 mb-6">Este quarto está aguardando limpeza</p>
                
                <button onclick="liberarQuarto(${quarto.id})" 
                        class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    Marcar como Limpo
                </button>
            </div>
        </div>
    `;

    const modalContainer = document.getElementById('modalQuarto');
    modalContainer.innerHTML = modalContent;
    modalContainer.classList.remove('hidden');
}

// Função para liberar quarto após limpeza
async function liberarQuarto(quartoId) {
    try {
        const response = await fetch('./api/quartos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update_status',
                id: quartoId,
                status: 'disponivel'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta da API:', errorText);
            throw new Error('Erro ao liberar quarto');
        }

        const result = await response.json();
        if (result.success) {
            alert('Quarto liberado com sucesso!');
            fecharModal();
            await carregarQuartos();
        } else {
            throw new Error(result.message || 'Erro ao liberar quarto');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao liberar quarto. Tente novamente.');
    }
}

// Função auxiliar para formatar data e hora
function formatarDataHora(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

// Carregar cadastros para select
async function carregarCadastros() {
    try {
        const response = await fetch('./api/cadastros.php');
        if (!response.ok) throw new Error('Erro ao carregar cadastros');

        const cadastros = await response.json();
        const select = document.getElementById('titularSelect');
        select.innerHTML = '<option value="">Selecione um cadastro...</option>' +
            cadastros.map(c => `<option value="${c.id}">${c.nome} - ${c.cpf}</option>`).join('');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar cadastros. Tente novamente.');
    }
}

// Inicializar formulário de check-in
function inicializarFormularioCheckIn() {
    // Limpar formulário
    document.getElementById('checkInForm').reset();
    document.getElementById('infoTitular').classList.add('hidden');
    document.getElementById('listaAcompanhantes').innerHTML = '';
    acompanhantes = [];

    // Configurar data mínima para check-in e check-out
    const agora = new Date();
    const dataMinima = agora.toISOString().slice(0, 16);
    document.getElementById('dataCheckIn').min = dataMinima;
    document.getElementById('dataCheckOutPrevisto').min = dataMinima;

    // Definir data/hora atual como padrão para check-in
    document.getElementById('dataCheckIn').value = dataMinima;

    // Definir o check-out para o dia seguinte no mesmo horário da entrada
    const dataCheckOut = new Date(agora);
    dataCheckOut.setDate(dataCheckOut.getDate() + 1); // Adiciona 1 dia
    const dataCheckOutMinima = dataCheckOut.toISOString().slice(0, 16);
    document.getElementById('dataCheckOutPrevisto').value = dataCheckOutMinima;

    // Calcular valor total
    calcularValorTotal();
}


// Selecionar titular
async function selecionarTitular(cadastroId) {
    if (!cadastroId) {
        document.getElementById('infoTitular').classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`./api/cadastros.php?id=${cadastroId}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do cadastro');

        const cadastro = await response.json();
        document.getElementById('infoTitular').innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="font-semibold">${cadastro.nome}</p>
                <p class="text-sm text-gray-600">CPF: ${cadastro.cpf}</p>
                <p class="text-sm text-gray-600">Telefone: ${cadastro.telefone}</p>
                <p class="text-sm text-gray-600">Cidade: ${cadastro.cidade}</p>
            </div>
        `;
        document.getElementById('infoTitular').classList.remove('hidden');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados do cadastro. Tente novamente.');
    }
}

// Função para selecionar acompanhante
async function selecionarAcompanhante(acompanhanteId, cadastroId) {
    if (!cadastroId) {
        document.getElementById(`infoAcomp_${acompanhanteId}`).classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`./api/cadastros.php?id=${cadastroId}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do cadastro');

        const cadastro = await response.json();

        // Atualizar o objeto de acompanhantes
        const index = acompanhantes.findIndex(a => a.id === acompanhanteId);
        if (index !== -1) {
            acompanhantes[index].cadastroId = cadastroId;
        }

        // Atualizar a exibição das informações
        document.getElementById(`infoAcomp_${acompanhanteId}`).innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="font-semibold">${cadastro.nome}</p>
                <p class="text-sm text-gray-600">CPF: ${cadastro.cpf}</p>
                <p class="text-sm text-gray-600">Telefone: ${cadastro.telefone}</p>
                <p class="text-sm text-gray-600">Cidade: ${cadastro.cidade}</p>
            </div>
        `;
        document.getElementById(`infoAcomp_${acompanhanteId}`).classList.remove('hidden');

        // Recalcular valor total
        calcularValorTotal();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados do cadastro. Tente novamente.');
    }
}

// Função para adicionar acompanhante
function adicionarAcompanhante() {
    if (acompanhantes.length >= quartoSelecionado.capacidade - 1) {
        alert('Capacidade máxima do quarto atingida!');
        return;
    }

    const container = document.getElementById('listaAcompanhantes');
    const acompanhanteId = Date.now();

    acompanhanteDiv = document.createElement('div');
    acompanhanteDiv.innerHTML = `
        <div class="flex gap-4 items-end" id="acomp_${acompanhanteId}">
            <div class="flex-grow">
                <label class="block text-sm font-medium text-gray-700">Selecionar Acompanhante</label>
                <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        onchange="selecionarAcompanhante(${acompanhanteId}, this.value)">
                    <option value="">Selecione um cadastro...</option>
                    ${document.getElementById('titularSelect').innerHTML}
                </select>
            </div>
            <button type="button" onclick="removerAcompanhante(${acompanhanteId})"
                    class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="infoAcomp_${acompanhanteId}" class="mt-2 hidden"></div>
    `;

    container.appendChild(acompanhanteDiv);
    acompanhantes.push({ id: acompanhanteId });
    atualizarValorBase();
}

// Função para remover acompanhante
function removerAcompanhante(acompanhanteId) {
    const elemento = document.getElementById(`acomp_${acompanhanteId}`);
    if (elemento) {
        elemento.parentElement.remove();
        acompanhantes = acompanhantes.filter(a => a.id !== acompanhanteId);
        atualizarValorBase();
    }
}

// Função para salvar cadastro rápido
async function salvarCadastroRapido(event, tipo) {
    event.preventDefault();

    const dados = {
        nome: document.getElementById('nomeRapido').value,
        cpf: document.getElementById('cpfRapido').value,
        telefone: document.getElementById('telefoneRapido').value,
        cidade: document.getElementById('cidadeRapido').value
    };

    try {
        const response = await fetch('./api/cadastros.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error('Erro ao salvar cadastro');

        const result = await response.json();
        if (result.success) {
            await carregarCadastros(); // Recarrega a lista de cadastros
            fecharModalCadastroRapido();

            // Se for cadastro de titular, seleciona automaticamente
            if (tipo === 'titular') {
                document.getElementById('titularSelect').value = result.id;
                await selecionarTitular(result.id);
            }
        } else {
            throw new Error(result.message || 'Erro ao salvar cadastro');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao salvar cadastro. Tente novamente.');
    }
}

// Função para fechar modal de cadastro rápido
function fecharModalCadastroRapido() {
    document.getElementById('modalCadastroRapido').classList.add('hidden');
}

// Função para mostrar modal de check-in
async function mostrarModalCheckIn(quarto) {
    const caixaAberto = await verificarStatusCaixa();
    if (!caixaAberto) {
        mostrarModalCaixaFechado();
        return;
    }
    
    quartoSelecionado = quarto;
    valorPorPessoa = parseFloat(quarto.preco_diaria);

    const modalContent = `
        <div class="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold">Check-in - Quarto ${quarto.numero}</h3>
                <button onclick="fecharModal()" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Informações do Quarto -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="font-semibold">Tipo:</span>
                        <span>${quarto.tipo}</span>
                    </div>
                    <div>
                        <span class="font-semibold">Capacidade:</span>
                        <span>${quarto.capacidade} pessoas</span>
                    </div>
                    <div>
                        <span class="font-semibold">Valor por pessoa:</span>
                        <span>R$ ${quarto.preco_diaria}</span>
                    </div>
                </div>
            </div>

            <form id="checkInForm" onsubmit="realizarCheckIn(event)" class="space-y-6">
                <input type="hidden" id="quartoId" value="${quarto.id}">
                
                <!-- Titular da Hospedagem -->
                <div class="border-b pb-4">
                    <h4 class="text-lg font-semibold mb-4">Titular da Hospedagem</h4>
                    <div class="flex gap-4 items-end">
                        <div class="flex-grow">
                            <label class="block text-sm font-medium text-gray-700">Selecionar Cadastro</label>
                            <select id="titularSelect" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    onchange="selecionarTitular(this.value)">
                                <option value="">Selecione um cadastro...</option>
                            </select>
                        </div>
                        <button type="button" onclick="abrirModalCadastroRapido('titular')"
                                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                            Novo Cadastro
                        </button>
                    </div>
                    <div id="infoTitular" class="mt-4 hidden">
                        <!-- Preenchido via JavaScript -->
                    </div>
                </div>

                <!-- Acompanhantes -->
                <div class="border-b pb-4">
                    <h4 class="text-lg font-semibold mb-4">Acompanhantes</h4>
                    <div id="listaAcompanhantes" class="space-y-4">
                        <!-- Lista de acompanhantes adicionados -->
                    </div>
                    <button type="button" onclick="adicionarAcompanhante()"
                            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Adicionar Acompanhante
                    </button>
                </div>

                <!-- Valores e Datas -->
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Datas</h4>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Check-in</label>
                                <input type="datetime-local" id="dataCheckIn" required
                                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                       onchange="atualizarValorBase()">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Check-out Previsto</label>
                                <input type="datetime-local" id="dataCheckOutPrevisto" required
                                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                       onchange="atualizarValorBase()">
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Valores</h4>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Valor Base</label>
                                <input type="text" id="valorBase" readonly
                                       class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Desconto</label>
                                <input type="number" 
                                       id="desconto" 
                                       min="0" 
                                       step="0.01"
                                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                       oninput="formatarInputMonetario(this); calcularValorTotal()">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Valor Total</label>
                                <input type="text" id="valorTotal" readonly
                                       class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm font-bold text-lg">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Adicionar dentro do formCheckIn, antes dos botões -->
                <div class="border-b pb-4">
                    <h4 class="text-lg font-semibold mb-4">Pagamento</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                            <select id="formaPagamento" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="dinheiro">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="cartao_credito">Cartão de Crédito</option>
                                <option value="cartao_debito">Cartão de Débito</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Valor Pago</label>
                            <input type="number" 
                                   id="valorPago" 
                                   min="0" 
                                   step="0.01"
                                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                   oninput="formatarInputMonetario(this); calcularSaldoRestante()">
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700">Saldo Restante</label>
                        <input type="text" id="saldoRestante" readonly
                            class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm">
                    </div>
                </div>

                <!-- Botões -->
                <div class="flex justify-end space-x-2 pt-4">
                    <button type="button" onclick="fecharModal()"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Confirmar Check-in
                    </button>
                </div>
            </form>
        </div>
    `;

    const modalContainer = document.getElementById('modalQuarto');
    modalContainer.innerHTML = modalContent;
    modalContainer.classList.remove('hidden');

    // Carregar cadastros para o select
    await carregarCadastros();

    // Inicializar formulário
    inicializarFormularioCheckIn();
}

// Função para formatar valores em reais
function formatarMoeda(valor) {
    if (isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para converter string de moeda em número
function converterMoedaParaNumero(valor) {
    if (!valor) return 0;
    // Remove todos os caracteres exceto números e vírgula/ponto
    const numeroLimpo = valor.replace(/[^\d,.-]/g, '')
                           .replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
}

// Função para atualizar valor base
function atualizarValorBase() {
    const valorPorPessoa = parseFloat(quartoSelecionado.preco_diaria);
    const numeroPessoas = 1 + acompanhantes.length;
    
    const dataCheckIn = new Date(document.getElementById('dataCheckIn').value);
    const dataCheckOut = new Date(document.getElementById('dataCheckOutPrevisto').value);
    const diferencaDias = Math.ceil((dataCheckOut - dataCheckIn) / (1000 * 60 * 60 * 24));
    
    if (isNaN(diferencaDias) || diferencaDias <= 0) {
        document.getElementById('valorBase').value = formatarMoeda(0);
        return;
    }

    const valorBase = valorPorPessoa * numeroPessoas * diferencaDias;
    document.getElementById('valorBase').value = formatarMoeda(valorBase);
    
    // Reseta os campos de desconto e pagamento
    document.getElementById('desconto').value = '0';
    document.getElementById('valorPago').value = '0';
    
    calcularValorTotal();
}

// Função para calcular valor total
function calcularValorTotal() {
    const valorBase = converterMoedaParaNumero(document.getElementById('valorBase').value);
    const desconto = parseFloat(document.getElementById('desconto').value) || 0;
    
    validarCampo(
        document.getElementById('desconto'),
        valorBase,
        'O desconto não pode ser maior que o valor base'
    );
    
    const valorTotal = valorBase - desconto;
    document.getElementById('valorTotal').value = formatarMoeda(valorTotal);
    calcularSaldoRestante();
}

// Função para calcular saldo restante
function calcularSaldoRestante() {
    const valorTotal = converterMoedaParaNumero(document.getElementById('valorTotal').value);
    const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
    
    validarCampo(
        document.getElementById('valorPago'),
        valorTotal,
        'O valor pago não pode ser maior que o valor total'
    );
    
    const saldoRestante = valorTotal - valorPago;
    document.getElementById('saldoRestante').value = formatarMoeda(saldoRestante);
}

// Atualizar a função de realizar check-in
async function realizarCheckIn(event) {
    event.preventDefault();

    const valorTotal = converterMoedaParaNumero(document.getElementById('valorTotal').value);
    const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
    const desconto = parseFloat(document.getElementById('desconto').value) || 0;

    const dados = {
        action: 'create',
        quarto_id: quartoSelecionado.id,
        titular_id: document.getElementById('titularSelect').value,
        acompanhantes: acompanhantes.map(a => a.cadastroId).filter(Boolean),
        data_checkin: document.getElementById('dataCheckIn').value,
        data_checkout_previsto: document.getElementById('dataCheckOutPrevisto').value,
        valor_total: valorTotal,
        desconto: desconto,
        pagamento: {
            valor: valorPago,
            forma_pagamento: document.getElementById('formaPagamento').value
        }
    };

    try {
        const response = await fetch('./api/checkin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta da API:', errorText);
            throw new Error('Erro ao realizar check-in');
        }

        const result = await response.json();
        if (result.success) {
            // Registrar entrada no caixa
            if (valorPago > 0) {
                await registrarPagamentoCaixa('entrada', valorPago, dados.pagamento.forma_pagamento, `Hospedagem - Quarto ${quartoSelecionado.numero}`);
            }
            
            alert('Check-in realizado com sucesso!');
            window.location.reload();
        } else {
            throw new Error(result.message || 'Erro ao realizar check-in');
        }
    } catch (error) {
        console.error('Erro completo:', error);
        alert(error.message || 'Erro ao realizar check-in. Tente novamente.');
    }
}

// Função para registrar pagamento no caixa
async function registrarPagamentoCaixa(tipo, valor, formaPagamento, descricao) {
    const dados = {
        action: 'movimentacao',
        tipo: tipo,
        categoria: 'hospedagem',
        descricao: descricao,
        valor: valor,
        forma_pagamento: formaPagamento
    };

    try {
        const response = await fetch('api/caixa.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Erro ao registrar movimentação no caixa');
        }
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Função para fechar modal
function fecharModal() {
    // Fecha o modal principal
    document.getElementById('modalQuarto').classList.add('hidden');

    // Fecha o modal de cadastro rápido se estiver aberto
    const modalCadastroRapido = document.getElementById('modalCadastroRapido');
    if (modalCadastroRapido) {
        modalCadastroRapido.classList.add('hidden');
    }

    // Limpa as variáveis globais
    quartoSelecionado = null;
    acompanhantes = [];
    valorPorPessoa = 0;
}

// Função para fechar modal de cadastro rápido especificamente
function fecharModalCadastroRapido() {
    document.getElementById('modalCadastroRapido').classList.add('hidden');
}

// Adicionar listener para fechar modal ao clicar fora dele (opcional)
document.addEventListener('click', function (event) {
    const modalQuarto = document.getElementById('modalQuarto');
    const modalCadastroRapido = document.getElementById('modalCadastroRapido');

    // Se clicou fora do conteúdo do modal
    if (event.target === modalQuarto) {
        fecharModal();
    }

    // Se clicou fora do conteúdo do modal de cadastro rápido
    if (event.target === modalCadastroRapido) {
        fecharModalCadastroRapido();
    }
});

// Função para formatar input de valor monetário enquanto digita
function formatarInputMonetario(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = (parseFloat(valor) / 100).toFixed(2);
    input.value = valor;
}

// Função para validar campo com feedback visual
function validarCampo(input, valorMaximo, mensagemErro) {
    const valor = parseFloat(input.value) || 0;
    const campoMensagem = input.nextElementSibling || document.createElement('p');
    
    if (valor > valorMaximo) {
        input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        campoMensagem.className = 'text-red-500 text-sm mt-1';
        campoMensagem.textContent = mensagemErro;
        if (!input.nextElementSibling) {
            input.parentNode.appendChild(campoMensagem);
        }
        return false;
    } else {
        input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        if (campoMensagem) {
            campoMensagem.remove();
        }
        return true;
    }
}

// Função para verificar status do caixa
async function verificarStatusCaixa() {
    try {
        const response = await fetch('./api/caixa.php?action=status');
        const data = await response.json();
        return data.status === 'aberto';
    } catch (error) {
        console.error('Erro ao verificar status do caixa:', error);
        return false;
    }
}

// Função para mostrar modal de caixa fechado
function mostrarModalCaixaFechado() {
    const modalContent = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="text-center">
                    <i class="fas fa-cash-register text-red-500 text-5xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Caixa Fechado</h3>
                    <p class="text-gray-600 mb-8">
                        Não é possível realizar operações com o caixa fechado. 
                        Por favor, abra o caixa primeiro.
                    </p>
                    <button onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        OK
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalContent);
}