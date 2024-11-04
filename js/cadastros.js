// Variáveis globais
let cadastros = [];
let cadastrosFiltrados = [];

// Formatadores
const formatadores = {
    cpf: (valor) => {
        return valor
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    telefone: (valor) => {
        return valor
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    data: (valor) => {
        const data = new Date(valor);
        return data.toLocaleDateString('pt-BR');
    }
};

// Adicionar listeners para formatação automática
document.getElementById('cpf').addEventListener('input', (e) => {
    e.target.value = formatadores.cpf(e.target.value);
});

document.getElementById('telefone').addEventListener('input', (e) => {
    e.target.value = formatadores.telefone(e.target.value);
});

// Pesquisa e filtro
document.getElementById('pesquisa').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    filtrarCadastros(termo);
});

function filtrarCadastros(termo) {
    if (!termo) {
        cadastrosFiltrados = [...cadastros];
    } else {
        cadastrosFiltrados = cadastros.filter(cadastro => 
            cadastro.nome.toLowerCase().includes(termo) ||
            cadastro.cpf.includes(termo) ||
            cadastro.cidade.toLowerCase().includes(termo)
        );
    }
    atualizarListaCadastros();
}

// Funções do Modal
function abrirModalCadastro(id = null) {
    document.getElementById('modalTitulo').textContent = id ? 'Editar Cadastro' : 'Novo Cadastro';
    document.getElementById('cadastroId').value = id || '';
    document.getElementById('formCadastro').reset();

    if (id) {
        const cadastro = cadastros.find(c => c.id === id);
        if (cadastro) {
            document.getElementById('nome').value = cadastro.nome;
            document.getElementById('cpf').value = cadastro.cpf;
            document.getElementById('dataNascimento').value = cadastro.data_nascimento;
            document.getElementById('telefone').value = cadastro.telefone;
            document.getElementById('cidade').value = cadastro.cidade;
        }
    }

    document.getElementById('modalCadastro').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modalCadastro').classList.add('hidden');
}

// Funções de API
async function carregarCadastros() {
    try {
        const response = await fetch('./api/cadastros.php');
        if (!response.ok) throw new Error('Erro ao carregar cadastros');
        cadastros = await response.json();
        cadastrosFiltrados = [...cadastros];
        atualizarListaCadastros();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar cadastros. Tente novamente.');
    }
}

function atualizarListaCadastros() {
    const container = document.getElementById('listaCadastros');
    container.innerHTML = cadastrosFiltrados.map(cadastro => `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold">${cadastro.nome}</h3>
                <div class="flex space-x-2">
                    <button onclick="abrirModalCadastro(${cadastro.id})" 
                            class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="excluirCadastro(${cadastro.id})" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-2 text-sm text-gray-600">
                <p><i class="fas fa-id-card mr-2"></i>${cadastro.cpf}</p>
                <p><i class="fas fa-calendar mr-2"></i>${formatadores.data(cadastro.data_nascimento)}</p>
                <p><i class="fas fa-phone mr-2"></i>${cadastro.telefone}</p>
                <p><i class="fas fa-city mr-2"></i>${cadastro.cidade}</p>
            </div>
        </div>
    `).join('');
}

async function salvarCadastro(event) {
    event.preventDefault();
    
    const cadastroId = document.getElementById('cadastroId').value;
    const dados = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        data_nascimento: document.getElementById('dataNascimento').value,
        telefone: document.getElementById('telefone').value,
        cidade: document.getElementById('cidade').value
    };

    try {
        const response = await fetch('./api/cadastros.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...dados,
                id: cadastroId,
                action: cadastroId ? 'update' : 'create'
            })
        });

        if (!response.ok) throw new Error('Erro ao salvar cadastro');
        
        await carregarCadastros();
        fecharModal();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar cadastro. Tente novamente.');
    }
}

async function excluirCadastro(id) {
    if (!confirm('Tem certeza que deseja excluir este cadastro?')) return;

    try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('action', 'delete');

        const response = await fetch('./api/cadastros.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Erro ao excluir cadastro');
        
        await carregarCadastros();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir cadastro. Tente novamente.');
    }
}

// Inicialização
carregarCadastros(); 