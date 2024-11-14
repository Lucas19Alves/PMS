let caixaAtual = null;
let movimentacoes = [];

// Variáveis globais para os gráficos
let graficoMovimentacoes = null;
let graficoFormasPagamento = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await verificarStatusCaixa();
    await carregarDashboard();
    await carregarGraficos();
    await carregarUltimasMovimentacoes();
});

// Verificar status do caixa
async function verificarStatusCaixa() {
    try {
        const response = await fetch('api/caixa.php?action=status');
        const data = await response.json();
        
        if (data.status === 'aberto') {
            caixaAtual = data.caixa;
            document.getElementById('caixaAberto').classList.remove('hidden');
            document.getElementById('btnFecharCaixa').classList.remove('hidden');
            document.getElementById('caixaFechado').classList.add('hidden');
            document.getElementById('btnAbrirCaixa').classList.add('hidden');
        } else {
            document.getElementById('caixaFechado').classList.remove('hidden');
            document.getElementById('btnAbrirCaixa').classList.remove('hidden');
            document.getElementById('caixaAberto').classList.add('hidden');
            document.getElementById('btnFecharCaixa').classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao verificar status do caixa:', error);
        alert('Erro ao verificar status do caixa');
    }
}

// Modal de Abertura de Caixa
function abrirModalAberturaCaixa() {
    const modal = document.getElementById('modalAberturaCaixa');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Abertura de Caixa</h3>
                <button onclick="fecharModal('modalAberturaCaixa')" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form onsubmit="abrirCaixa(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Valor Inicial</label>
                    <input type="number" step="0.01" min="0" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="valorInicial">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              id="observacoesAbertura"></textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="fecharModal('modalAberturaCaixa')"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Abrir Caixa
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Abrir Caixa
async function abrirCaixa(event) {
    event.preventDefault();
    
    const dados = {
        action: 'abrir',
        valor_inicial: document.getElementById('valorInicial').value,
        observacoes: document.getElementById('observacoesAbertura').value,
        usuario_id: 1
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
        
        if (result.success) {
            alert('Caixa aberto com sucesso!');
            fecharModal('modalAberturaCaixa');
            await verificarStatusCaixa();
            await carregarDashboard();
        } else {
            throw new Error(result.message || 'Erro ao abrir caixa');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao abrir caixa');
    }
}

// Modal de Fechamento de Caixa
function abrirModalFechamentoCaixa() {
    const modal = document.getElementById('modalFechamentoCaixa');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Fechamento de Caixa</h3>
                <button onclick="fecharModal('modalFechamentoCaixa')" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form onsubmit="fecharCaixa(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Valor em Caixa</label>
                    <input type="number" step="0.01" min="0" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="valorFinal">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              id="observacoesFechamento"></textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="fecharModal('modalFechamentoCaixa')"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Fechar Caixa
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Fechar Caixa
async function fecharCaixa(event) {
    event.preventDefault();
    
    const dados = {
        action: 'fechar',
        valor_final: document.getElementById('valorFinal').value,
        observacoes: document.getElementById('observacoesFechamento').value
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
        
        if (result.success) {
            alert('Caixa fechado com sucesso!');
            fecharModal('modalFechamentoCaixa');
            await verificarStatusCaixa();
            await carregarDashboard();
        } else {
            throw new Error(result.message || 'Erro ao fechar caixa');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao fechar caixa');
    }
}

// Modal de Nova Entrada/Saída
function abrirModalMovimentacao(tipo) {
    const modal = document.getElementById('modalMovimentacao');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Nova ${tipo === 'entrada' ? 'Entrada' : 'Saída'}</h3>
                <button onclick="fecharModal('modalMovimentacao')" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form onsubmit="registrarMovimentacao(event, '${tipo}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Categoria</label>
                    <select required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            id="categoriaMovimentacao">
                        ${tipo === 'entrada' ? `
                            <option value="hospedagem">Hospedagem</option>
                            <option value="servicos">Serviços</option>
                            <option value="outros">Outros</option>
                        ` : `
                            <option value="fornecedores">Fornecedores</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="despesas">Despesas Gerais</option>
                            <option value="outros">Outros</option>
                        `}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Descrição</label>
                    <input type="text" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="descricaoMovimentacao">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Valor</label>
                    <input type="number" step="0.01" min="0" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="valorMovimentacao">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <select required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            id="formaPagamento">
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                    </select>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="fecharModal('modalMovimentacao')"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="px-4 py-2 ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md">
                        Confirmar
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Registrar Movimentação
async function registrarMovimentacao(event, tipo) {
    event.preventDefault();
    
    const dados = {
        action: 'movimentacao',
        tipo: tipo,
        categoria: document.getElementById('categoriaMovimentacao').value,
        descricao: document.getElementById('descricaoMovimentacao').value,
        valor: document.getElementById('valorMovimentacao').value,
        forma_pagamento: document.getElementById('formaPagamento').value
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
        
        if (result.success) {
            alert('Movimentação registrada com sucesso!');
            fecharModal('modalMovimentacao');
            await carregarDashboard();
            await carregarUltimasMovimentacoes();
            await carregarGraficos();
        } else {
            throw new Error(result.message || 'Erro ao registrar movimentação');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao registrar movimentação');
    }
}

// Carregar Dashboard
async function carregarDashboard() {
    try {
        const response = await fetch('api/caixa.php?action=dashboard');
        const data = await response.json();
        
        document.getElementById('saldoAtual').textContent = `R$ ${data.saldo_atual.toFixed(2)}`;
        document.getElementById('entradasHoje').textContent = `R$ ${data.entradas_hoje.toFixed(2)}`;
        document.getElementById('saidasHoje').textContent = `R$ ${data.saidas_hoje.toFixed(2)}`;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Carregar Gráficos
async function carregarGraficos() {
    try {
        const response = await fetch('api/caixa.php?action=graficos');
        const data = await response.json();
        
        // Destruir gráficos existentes
        if (graficoMovimentacoes) {
            graficoMovimentacoes.destroy();
        }
        if (graficoFormasPagamento) {
            graficoFormasPagamento.destroy();
        }

        // Gráfico de Movimentações
        const ctxMovimentacoes = document.getElementById('graficoMovimentacoes').getContext('2d');
        graficoMovimentacoes = new Chart(ctxMovimentacoes, {
            type: 'line',
            data: {
                labels: data.movimentacoes.labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: data.movimentacoes.entradas,
                        borderColor: 'rgb(34, 197, 94)',
                        tension: 0.1
                    },
                    {
                        label: 'Saídas',
                        data: data.movimentacoes.saidas,
                        borderColor: 'rgb(239, 68, 68)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });

        // Gráfico de Formas de Pagamento
        const ctxFormasPagamento = document.getElementById('graficoFormasPagamento').getContext('2d');
        graficoFormasPagamento = new Chart(ctxFormasPagamento, {
            type: 'doughnut',
            data: {
                labels: data.formas_pagamento.labels,
                datasets: [{
                    data: data.formas_pagamento.valores,
                    backgroundColor: [
                        'rgb(34, 197, 94)',
                        'rgb(59, 130, 246)',
                        'rgb(239, 68, 68)',
                        'rgb(234, 179, 8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

// Carregar Últimas Movimentações
async function carregarUltimasMovimentacoes() {
    try {
        const response = await fetch('api/caixa.php?action=movimentacoes');
        const data = await response.json();
        
        const tbody = document.getElementById('tabelaMovimentacoes');
        tbody.innerHTML = data.map(mov => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${formatarDataHora(mov.data_hora)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${mov.descricao}</td>
                <td class="px-6 py-4 whitespace-nowrap">${mov.categoria}</td>
                <td class="px-6 py-4 whitespace-nowrap font-medium
                           ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}">
                    R$ ${parseFloat(mov.valor).toFixed(2)}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
    }
}

// Funções Auxiliares
function formatarDataHora(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Funções para Relatórios
function abrirModalRelatorioPersonalizado() {
    const modal = document.getElementById('modalRelatorio');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Relatório Personalizado</h3>
                <button onclick="fecharModal('modalRelatorio')" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form onsubmit="gerarRelatorioPersonalizado(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Data Inicial</label>
                    <input type="date" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="dataInicial">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Data Final</label>
                    <input type="date" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                           id="dataFinal">
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="fecharModal('modalRelatorio')"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Gerar Relatório
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function gerarRelatorio(tipo) {
    const data = new Date().toISOString().split('T')[0];
    window.open(`api/relatorios.php?tipo=${tipo}&data=${data}`, '_blank');
}

async function gerarRelatorioPersonalizado(event) {
    event.preventDefault();
    const dataInicial = document.getElementById('dataInicial').value;
    const dataFinal = document.getElementById('dataFinal').value;
    window.open(`api/relatorios.php?tipo=personalizado&data_inicial=${dataInicial}&data_final=${dataFinal}`, '_blank');
    fecharModal('modalRelatorio');
}

// Função wrapper para abrir modal de entrada
function abrirModalEntrada() {
    abrirModalMovimentacao('entrada');
}

// Função wrapper para abrir modal de saída
function abrirModalSaida() {
    abrirModalMovimentacao('saida');
}
