let gastos = [];
let investimentos = [];
let criptoInvestimentos = [];
let gastosChart, investChart;
let btcPrice = 0, solPrice = 0;
let currentTheme = 'dark';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadTheme();
    initCharts();
    fetchCryptoPrices();
    setInterval(fetchCryptoPrices, 60000);
    updateDashboard();
    
    // Define data de hoje como padrão
    document.getElementById('gastoData').valueAsDate = new Date();
    document.getElementById('investData').valueAsDate = new Date();
    document.getElementById('criptoData').valueAsDate = new Date();
});

// CONFIGURAÇÕES E TEMAS
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    updateThemeSelection();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function changeTheme(theme) {
    currentTheme = theme;
    if (theme === 'vibrant') {
        document.body.classList.add('theme-vibrant');
    } else {
        document.body.classList.remove('theme-vibrant');
    }
    localStorage.setItem('theme', theme);
    updateThemeSelection();
}

function updateThemeSelection() {
    document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById('theme-' + currentTheme).classList.add('active');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        changeTheme(savedTheme);
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target == modal) {
        closeSettings();
    }
}

// Carregar dados salvos
function loadData() {
    const savedGastos = localStorage.getItem('gastos');
    const savedInvest = localStorage.getItem('investimentos');
    const savedCripto = localStorage.getItem('criptoInvestimentos');
    
    if (savedGastos) {
        gastos = JSON.parse(savedGastos);
        renderGastos();
    }
    if (savedInvest) {
        investimentos = JSON.parse(savedInvest);
        renderInvestimentos();
    }
    if (savedCripto) {
        criptoInvestimentos = JSON.parse(savedCripto);
        renderCripto();
    }
}

// Salvar dados
function saveData() {
    localStorage.setItem('gastos', JSON.stringify(gastos));
    localStorage.setItem('investimentos', JSON.stringify(investimentos));
    localStorage.setItem('criptoInvestimentos', JSON.stringify(criptoInvestimentos));
}

// EXPORTAR DADOS
function exportData() {
    const data = {
        gastos: gastos,
        investimentos: investimentos,
        criptoInvestimentos: criptoInvestimentos,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccess('Backup exportado com sucesso!');
}

// IMPORTAR DADOS
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Tem certeza? Isso substituirá TODOS os dados atuais.')) {
                gastos = data.gastos || [];
                investimentos = data.investimentos || [];
                criptoInvestimentos = data.criptoInvestimentos || [];
                
                saveData();
                renderGastos();
                renderInvestimentos();
                renderCripto();
                updateDashboard();
                
                showSuccess('Dados importados com sucesso!');
                openTab('dashboard');
            }
        } catch (error) {
            alert('Erro ao importar arquivo. Verifique se é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// LIMPAR DADOS
function clearAllData() {
    if (confirm('ATENÇÃO! Isso irá apagar TODOS os seus dados. Tem certeza?')) {
        if (confirm('Última chance! Não será possível recuperar. Continuar?')) {
            gastos = [];
            investimentos = [];
            criptoInvestimentos = [];
            localStorage.removeItem('gastos');
            localStorage.removeItem('investimentos');
            localStorage.removeItem('criptoInvestimentos');
            
            renderGastos();
            renderInvestimentos();
            renderCripto();
            updateDashboard();
            
            showSuccess('Todos os dados foram removidos.');
        }
    }
}

function showSuccess(message) {
    const el = document.getElementById('successMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// Buscar preços de criptomoedas
async function fetchCryptoPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=brl');
        const data = await response.json();
        
        btcPrice = data.bitcoin.brl;
        solPrice = data.solana.brl;
        
        document.getElementById('btcPrice').textContent = formatCurrency(btcPrice);
        document.getElementById('solPrice').textContent = formatCurrency(solPrice);
        
        const now = new Date().toLocaleString('pt-BR');
        document.getElementById('btcUpdate').textContent = `Atualizado: ${now}`;
        document.getElementById('solUpdate').textContent = `Atualizado: ${now}`;
    } catch (error) {
        console.error('Erro ao buscar preços:', error);
        document.getElementById('btcPrice').textContent = 'Erro';
        document.getElementById('solPrice').textContent = 'Erro';
    }
}

function openTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    const tabs = document.querySelectorAll('.tab');
    
    contents.forEach(content => content.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'dashboard') {
        updateDashboard();
    }
}

// GASTOS
function addGasto() {
    const data = document.getElementById('gastoData').value;
    const desc = document.getElementById('gastoDesc').value;
    const valor = parseFloat(document.getElementById('gastoValor').value);
    const categoria = document.getElementById('gastoCategoria').value;
    
    if (!data || !desc || !valor) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const gasto = {
        id: Date.now(),
        data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR'),
        dataISO: data,
        descricao: desc,
        valor: valor,
        categoria: categoria
    };
    
    gastos.push(gasto);
    gastos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderGastos();
    saveData();
    updateDashboard();
    
    document.getElementById('gastoDesc').value = '';
    document.getElementById('gastoValor').value = '';
    document.getElementById('gastoData').valueAsDate = new Date();
}

function editGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;
    
    const newData = prompt('Nova data (formato: DD/MM/AAAA):', gasto.data);
    if (newData === null) return;
    
    const newDesc = prompt('Nova descrição:', gasto.descricao);
    if (newDesc === null) return;
    
    const newValor = prompt('Novo valor:', gasto.valor);
    if (newValor === null) return;
    
    const newCategoria = prompt('Nova categoria (Lazer/Transporte/Saúde/Roupa/Outros):', gasto.categoria);
    if (newCategoria === null) return;
    
    // Converter data DD/MM/AAAA para ISO
    const parts = newData.split('/');
    if (parts.length === 3) {
        gasto.dataISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        gasto.data = newData;
    }
    
    gasto.descricao = newDesc;
    gasto.valor = parseFloat(newValor);
    gasto.categoria = newCategoria;
    
    gastos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderGastos();
    saveData();
    updateDashboard();
}

function deleteGasto(id) {
    if (confirm('Deseja excluir este gasto?')) {
        gastos = gastos.filter(g => g.id !== id);
        renderGastos();
        saveData();
        updateDashboard();
    }
}

function renderGastos() {
    const tbody = document.getElementById('gastosTable');
    tbody.innerHTML = gastos.map(g => `
        <tr>
            <td>${g.data}</td>
            <td>${g.descricao}</td>
            <td>${formatCurrency(g.valor)}</td>
            <td>${g.categoria}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editGasto(${g.id})">✏️ Editar</button>
                    <button class="delete-btn" onclick="deleteGasto(${g.id})">🗑️ Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// INVESTIMENTOS - LÓGICA CORRIGIDA
function addInvestimento() {
    const data = document.getElementById('investData').value;
    const valor = parseFloat(document.getElementById('investValor').value);
    const tipo = document.getElementById('investTipo').value;
    const desc = document.getElementById('investDesc').value;
    
    if (!data || !valor) {
        alert('Preencha a data e o valor!');
        return;
    }
    
    // MUDANÇA PRINCIPAL: Buscar o último investimento do MESMO TIPO
    const investimentosMesmoTipo = investimentos.filter(i => i.tipo === tipo);
    const anterior = investimentosMesmoTipo.length > 0 ? 
        investimentosMesmoTipo[investimentosMesmoTipo.length - 1].valor : 0;
    
    const lucro = valor - anterior;
    const percentual = anterior > 0 ? ((lucro / anterior) * 100) : 0;
    
    const invest = {
        id: Date.now(),
        data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR'),
        dataISO: data,
        valor: valor,
        lucro: lucro,
        percentual: percentual,
        tipo: tipo,
        descricao: desc
    };
    
    investimentos.push(invest);
    investimentos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderInvestimentos();
    saveData();
    updateDashboard();
    
    document.getElementById('investValor').value = '';
    document.getElementById('investDesc').value = '';
    document.getElementById('investData').valueAsDate = new Date();
}

function editInvest(id) {
    const invest = investimentos.find(i => i.id === id);
    if (!invest) return;
    
    const newData = prompt('Nova data (formato: DD/MM/AAAA):', invest.data);
    if (newData === null) return;
    
    const newValor = prompt('Novo valor investido:', invest.valor);
    if (newValor === null) return;
    
    const newDesc = prompt('Nova descrição:', invest.descricao);
    if (newDesc === null) return;
    
    // Converter data DD/MM/AAAA para ISO
    const parts = newData.split('/');
    if (parts.length === 3) {
        invest.dataISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        invest.data = newData;
    }
    
    // MUDANÇA: Buscar o investimento anterior do MESMO TIPO (por data)
    const investimentosMesmoTipo = investimentos
        .filter(i => i.tipo === invest.tipo && i.id !== invest.id)
        .sort((a, b) => new Date(a.dataISO) - new Date(b.dataISO));
    
    const indexNoTipo = investimentosMesmoTipo.findIndex(i => 
        new Date(i.dataISO) < new Date(invest.dataISO)
    );
    
    const anterior = indexNoTipo >= 0 ? investimentosMesmoTipo[indexNoTipo].valor : 0;
    
    invest.valor = parseFloat(newValor);
    invest.descricao = newDesc;
    invest.lucro = invest.valor - anterior;
    invest.percentual = anterior > 0 ? ((invest.lucro / anterior) * 100) : 0;
    
    investimentos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderInvestimentos();
    saveData();
    updateDashboard();
}

function deleteInvest(id) {
    if (confirm('Deseja excluir este investimento?')) {
        investimentos = investimentos.filter(i => i.id !== id);
        renderInvestimentos();
        saveData();
        updateDashboard();
    }
}

function renderInvestimentos() {
    const tbody = document.getElementById('investTable');
    tbody.innerHTML = investimentos.map(i => `
        <tr>
            <td>${i.data}</td>
            <td>${formatCurrency(i.valor)}</td>
            <td>${formatCurrency(i.lucro)}</td>
            <td>${i.percentual.toFixed(2)}%</td>
            <td>${i.descricao}</td>
            <td>${i.tipo}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editInvest(${i.id})">✏️ Editar</button>
                    <button class="delete-btn" onclick="deleteInvest(${i.id})">🗑️ Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// CRIPTOMOEDAS
function addCripto() {
    const data = document.getElementById('criptoData').value;
    const valor = parseFloat(document.getElementById('criptoValor').value);
    const tipo = document.getElementById('criptoTipo').value;
    const lucro = parseFloat(document.getElementById('criptoLucro').value) || 0;
    
    if (!data || !valor) {
        alert('Preencha a data e o valor!');
        return;
    }
    
    const anterior = valor - lucro;
    const percentual = anterior > 0 ? ((lucro / anterior) * 100) : 0;
    
    const cripto = {
        id: Date.now(),
        data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR'),
        dataISO: data,
        valor: valor,
        lucro: lucro,
        percentual: percentual,
        tipo: tipo
    };
    
    criptoInvestimentos.push(cripto);
    criptoInvestimentos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderCripto();
    saveData();
    updateDashboard();
    
    document.getElementById('criptoValor').value = '';
    document.getElementById('criptoLucro').value = '';
    document.getElementById('criptoData').valueAsDate = new Date();
}

function editCripto(id) {
    const cripto = criptoInvestimentos.find(c => c.id === id);
    if (!cripto) return;
    
    const newData = prompt('Nova data (formato: DD/MM/AAAA):', cripto.data);
    if (newData === null) return;
    
    const newValor = prompt('Novo valor investido:', cripto.valor);
    if (newValor === null) return;
    
    const newLucro = prompt('Novo lucro vs anterior:', cripto.lucro);
    if (newLucro === null) return;
    
    // Converter data DD/MM/AAAA para ISO
    const parts = newData.split('/');
    if (parts.length === 3) {
        cripto.dataISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        cripto.data = newData;
    }
    
    cripto.valor = parseFloat(newValor);
    cripto.lucro = parseFloat(newLucro);
    const anterior = cripto.valor - cripto.lucro;
    cripto.percentual = anterior > 0 ? ((cripto.lucro / anterior) * 100) : 0;
    
    criptoInvestimentos.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    renderCripto();
    saveData();
    updateDashboard();
}

function deleteCripto(id) {
    if (confirm('Deseja excluir este investimento?')) {
        criptoInvestimentos = criptoInvestimentos.filter(c => c.id !== id);
        renderCripto();
        saveData();
        updateDashboard();
    }
}

function renderCripto() {
    const tbody = document.getElementById('criptoTable');
    tbody.innerHTML = criptoInvestimentos.map(c => `
        <tr>
            <td>${c.data}</td>
            <td>${formatCurrency(c.valor)}</td>
            <td>${formatCurrency(c.lucro)}</td>
            <td>${c.percentual.toFixed(2)}%</td>
            <td>${c.tipo}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editCripto(${c.id})">✏️ Editar</button>
                    <button class="delete-btn" onclick="deleteCripto(${c.id})">🗑️ Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// DASHBOARD - LÓGICA CORRIGIDA
function updateDashboard() {
    const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
    
    // MUDANÇA PRINCIPAL: Somar o valor mais recente de CADA tipo de investimento
    const tiposInvest = [...new Set(investimentos.map(i => i.tipo))];
    const totalInvest = tiposInvest.reduce((sum, tipo) => {
        const investsTipo = investimentos.filter(i => i.tipo === tipo);
        if (investsTipo.length > 0) {
            // Pegar o mais recente por data
            const maisRecente = investsTipo.sort((a, b) => 
                new Date(b.dataISO) - new Date(a.dataISO)
            )[0];
            return sum + maisRecente.valor;
        }
        return sum;
    }, 0);
    
    // MUDANÇA: Somar o valor mais recente de CADA criptomoeda
    const tiposCripto = [...new Set(criptoInvestimentos.map(c => c.tipo))];
    const totalCripto = tiposCripto.reduce((sum, tipo) => {
        const criptosTipo = criptoInvestimentos.filter(c => c.tipo === tipo);
        if (criptosTipo.length > 0) {
            const maisRecente = criptosTipo.sort((a, b) => 
                new Date(b.dataISO) - new Date(a.dataISO)
            )[0];
            return sum + maisRecente.valor;
        }
        return sum;
    }, 0);
    
    const patrimonio = totalInvest + totalCripto;
    
    document.getElementById('totalGastos').textContent = formatCurrency(totalGastos);
    document.getElementById('totalInvest').textContent = formatCurrency(totalInvest);
    document.getElementById('totalCripto').textContent = formatCurrency(totalCripto);
    document.getElementById('patrimonioTotal').textContent = formatCurrency(patrimonio);
    
    updateCharts();
}

function initCharts() {
    const ctx1 = document.getElementById('gastosChart').getContext('2d');
    gastosChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Gastos por Categoria',
                data: [],
                backgroundColor: ['#8a2be2', '#9370db', '#ba55d3', '#da70d6', '#ee82ee']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    const ctx2 = document.getElementById('investChart').getContext('2d');
    investChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nubank',
                data: [],
                borderColor: '#8a2be2',
                tension: 0.4
            }, {
                label: 'Cripto',
                data: [],
                borderColor: '#ee82ee',
                tension: 0.4
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateCharts() {
    // Atualizar gráfico de gastos
    const categorias = {};
    gastos.forEach(g => {
        categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
    });
    
    gastosChart.data.labels = Object.keys(categorias);
    gastosChart.data.datasets[0].data = Object.values(categorias);
    gastosChart.update();

    // Atualizar gráfico de investimentos
    investChart.data.labels = investimentos.map((_, i) => `#${i + 1}`);
    investChart.data.datasets[0].data = investimentos.map(i => i.valor);
    investChart.data.datasets[1].data = criptoInvestimentos.map(c => c.valor);
    investChart.update();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}