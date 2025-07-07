// Configuração do JSONBin
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const JSONBIN_BIN_ID = '686c0c978561e97a50332828'; // Substitua pelo seu bin ID
const JSONBIN_API_KEY = '$2a$10$k5yoNnGcYVgXP5ynEya1L.JCvGLqSB09uhPtFsyFfBuRd2znDNasS'; // Substitua pela sua API key

// Estado da aplicação
let state = {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0
};

// Elementos do DOM
const elements = {
    monthSelect: document.getElementById('month'),
    yearInput: document.getElementById('year'),
    incomeTypeSelect: document.getElementById('income-type'),
    incomeAmountInput: document.getElementById('income-amount'),
    incomeDateInput: document.getElementById('income-date'),
    addIncomeBtn: document.getElementById('add-income'),
    
    expenseCategorySelect: document.getElementById('expense-category'),
    expenseAmountInput: document.getElementById('expense-amount'),
    expenseDateInput: document.getElementById('expense-date'),
    expenseDescriptionInput: document.getElementById('expense-description'),
    addExpenseBtn: document.getElementById('add-expense'),
    
    balanceDisplay: document.getElementById('balance'),
    
    incomesTable: document.getElementById('incomes-table').querySelector('tbody'),
    expensesTable: document.getElementById('expenses-table').querySelector('tbody'),
    investmentsTable: document.getElementById('investments-table').querySelector('tbody'),
    
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    exportExcelBtn: document.getElementById('export-excel'),
    openInvestmentBtn: document.getElementById('open-investment'),
    
    // Modal elements
    investmentModal: document.getElementById('investment-modal'),
    closeModalBtn: document.querySelector('.close'),
    investmentAmountInput: document.getElementById('investment-amount'),
    interestRateInput: document.getElementById('interest-rate'),
    investmentDateInput: document.getElementById('investment-date'),
    addInvestmentBtn: document.getElementById('add-investment'),
    totalInvestedSpan: document.getElementById('total-invested'),
    accumulatedValueSpan: document.getElementById('accumulated-value'),
    earningsSpan: document.getElementById('earnings'),
    detailedInvestmentsTable: document.getElementById('detailed-investments').querySelector('tbody')
};

// Funções utilitárias
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function calculateCompoundInterest(investments) {
    let totalInvested = 0;
    let totalValue = 0;
    
    investments.forEach(investment => {
        totalInvested += investment.amount;
        
        const monthsSinceInvestment = (new Date() - new Date(investment.date)) / (1000 * 60 * 60 * 24 * 30);
        const monthlyRate = Math.pow(1 + (investment.interestRate / 100), 1/12) - 1;
        const currentValue = investment.amount * Math.pow(1 + monthlyRate, monthsSinceInvestment);
        
        totalValue += currentValue;
    });
    
    return {
        totalInvested,
        totalValue,
        earnings: totalValue - totalInvested
    };
}

// Funções para manipulação do estado
// Modifique a função loadData para garantir que os dados sejam sempre válidos
async function loadData() {
    try {
        console.log('Iniciando carregamento de dados...');
        const response = await fetch(`${JSONBIN_BASE_URL}/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': false
            }
        });
        
        if (!response.ok) {
            console.log('Criando novo bin vazio...');
            // Se não existir, inicializa com estrutura vazia
            state = {
                incomes: [],
                expenses: [],
                investments: [],
                balance: 0
            };
            await saveData(); // Cria o bin com estrutura inicial
            updateUI();
            return;
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        // Verifica e garante a estrutura correta dos dados
        state = {
            incomes: Array.isArray(data?.incomes) ? data.incomes : [],
            expenses: Array.isArray(data?.expenses) ? data.expenses : [],
            investments: Array.isArray(data?.investments) ? data.investments : [],
            balance: typeof data?.balance === 'number' ? data.balance : 0
        };
        
        console.log('Estado carregado com sucesso:', state);
        updateUI();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Inicializa com estrutura vazia em caso de erro
        state = {
            incomes: [],
            expenses: [],
            investments: [],
            balance: 0
        };
        updateUI();
    }
}

// Modifique as funções de salvar para usar notificações
async function saveData() {
    try {
        const response = await fetch(`${JSONBIN_BASE_URL}/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(state)
        });
        
        if (!response.ok) throw new Error('Falha ao salvar dados');
        
        showNotification('Dados salvos com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showNotification('Erro ao salvar dados: ' + error.message, true);
    }
}

// Funções para atualização da UI
// Atualize a função updateUI para verificar os arrays antes de usar reduce
function updateUI() {
    console.log('Atualizando UI com estado:', state);
    
    try {
        // Atualizar saldo com verificações de segurança
        const totalIncome = Array.isArray(state.incomes) 
            ? state.incomes.reduce((sum, income) => sum + (income?.amount || 0), 0)
            : 0;
            
        const totalExpenses = Array.isArray(state.expenses) 
            ? state.expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0)
            : 0;
            
        state.balance = totalIncome - totalExpenses;
        elements.balanceDisplay.textContent = formatCurrency(state.balance);
        
        // Atualizar tabelas
        updateIncomesTable();
        updateExpensesTable();
        updateInvestmentsTable();
        
        // Atualizar resumo de investimentos
        updateInvestmentSummary();
    } catch (error) {
        console.error('Erro ao atualizar UI:', error);
        alert('Ocorreu um erro ao atualizar a interface. Por favor, recarregue a página.');
    }
}

// Adicione esta função de inicialização segura
function initializeSafeState() {
    if (!state) {
        state = {
            incomes: [],
            expenses: [],
            investments: [],
            balance: 0
        };
    } else {
        state.incomes = Array.isArray(state.incomes) ? state.incomes : [];
        state.expenses = Array.isArray(state.expenses) ? state.expenses : [];
        state.investments = Array.isArray(state.investments) ? state.investments : [];
        state.balance = typeof state.balance === 'number' ? state.balance : 0;
    }
}

function updateIncomesTable() {
    console.log('Atualizando tabela de entradas');
    elements.incomesTable.innerHTML = '';
    
    state.incomes.forEach(income => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(income.date)}</td>
            <td>${income.type === 'salary' ? 'Salário' : 'Flash'}</td>
            <td>${formatCurrency(income.amount)}</td>
        `;
        
        elements.incomesTable.appendChild(row);
    });
}

function updateExpensesTable() {
    console.log('Atualizando tabela de gastos');
    elements.expensesTable.innerHTML = '';
    
    state.expenses.forEach(expense => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${getExpenseCategoryName(expense.category)}</td>
            <td>${expense.description || '-'}</td>
            <td>${formatCurrency(expense.amount)}</td>
        `;
        
        elements.expensesTable.appendChild(row);
    });
}

function updateInvestmentsTable() {
    console.log('Atualizando tabela de investimentos');
    elements.investmentsTable.innerHTML = '';
    
    state.investments.forEach(investment => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(investment.date)}</td>
            <td>${formatCurrency(investment.amount)}</td>
            <td>${investment.interestRate}%</td>
            <td>${formatCurrency(calculateCurrentInvestmentValue(investment))}</td>
        `;
        
        elements.investmentsTable.appendChild(row);
    });
}

function updateInvestmentSummary() {
    console.log('Atualizando resumo de investimentos');
    const { totalInvested, totalValue, earnings } = calculateCompoundInterest(state.investments);
    
    elements.totalInvestedSpan.textContent = formatCurrency(totalInvested);
    elements.accumulatedValueSpan.textContent = formatCurrency(totalValue);
    elements.earningsSpan.textContent = formatCurrency(earnings);
    
    // Atualizar tabela detalhada de investimentos
    elements.detailedInvestmentsTable.innerHTML = '';
    
    state.investments.forEach(investment => {
        const currentValue = calculateCurrentInvestmentValue(investment);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(investment.date)}</td>
            <td>${formatCurrency(investment.amount)}</td>
            <td>${investment.interestRate}%</td>
            <td>${formatCurrency(currentValue)}</td>
        `;
        
        elements.detailedInvestmentsTable.appendChild(row);
    });
}

function calculateCurrentInvestmentValue(investment) {
    const monthsSinceInvestment = (new Date() - new Date(investment.date)) / (1000 * 60 * 60 * 24 * 30);
    const monthlyRate = Math.pow(1 + (investment.interestRate / 100), 1/12) - 1;
    return investment.amount * Math.pow(1 + monthlyRate, monthsSinceInvestment);
}

function getExpenseCategoryName(category) {
    const categories = {
        investment: 'Investimento',
        mother: 'Ajudar Mãe',
        personal: 'Pessoais',
        friends: 'Amigos',
        girlfriend: 'Namorada'
    };
    
    return categories[category] || category;
}

// Manipuladores de eventos
function setupEventListeners() {
    console.log('Configurando event listeners');
    
    // Adicionar entrada
    elements.addIncomeBtn.addEventListener('click', async () => {
        const amount = parseFloat(elements.incomeAmountInput.value);
        const type = elements.incomeTypeSelect.value;
        const date = elements.incomeDateInput.value || new Date().toISOString().split('T')[0];
        const month = parseInt(elements.monthSelect.value);
        const year = parseInt(elements.yearInput.value);
        
        if (!amount || amount <= 0) {
            alert('Por favor, insira um valor válido');
            return;
        }
        
        state.incomes.push({
            amount,
            type,
            date,
            month,
            year
        });
        
        console.log('Nova entrada adicionada:', state.incomes[state.incomes.length - 1]);
        
        try {
            await saveData();
            updateUI();
            elements.incomeAmountInput.value = '';
        } catch (error) {
            console.error('Erro ao adicionar entrada:', error);
            alert('Erro ao salvar entrada');
        }
    });
    
    // Adicionar gasto
    elements.addExpenseBtn.addEventListener('click', async () => {
        const amount = parseFloat(elements.expenseAmountInput.value);
        const category = elements.expenseCategorySelect.value;
        const date = elements.expenseDateInput.value || new Date().toISOString().split('T')[0];
        const description = elements.expenseDescriptionInput.value;
        
        if (!amount || amount <= 0) {
            alert('Por favor, insira um valor válido');
            return;
        }
        
        if (category === 'investment') {
            alert('Para investimentos, use a tela específica');
            return;
        }
        
        state.expenses.push({
            amount,
            category,
            date,
            description
        });
        
        console.log('Novo gasto adicionado:', state.expenses[state.expenses.length - 1]);
        
        try {
            await saveData();
            updateUI();
            elements.expenseAmountInput.value = '';
            elements.expenseDescriptionInput.value = '';
        } catch (error) {
            console.error('Erro ao adicionar gasto:', error);
            alert('Erro ao salvar gasto');
        }
    });
    
    // Abas
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remover classe active de todos os botões e conteúdos
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            elements.tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active ao botão e conteúdo selecionado
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Modal de investimentos
    elements.openInvestmentBtn.addEventListener('click', () => {
        elements.investmentModal.style.display = 'block';
    });
    
    elements.closeModalBtn.addEventListener('click', () => {
        elements.investmentModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.investmentModal) {
            elements.investmentModal.style.display = 'none';
        }
    });
    
    // Adicionar investimento
    elements.addInvestmentBtn.addEventListener('click', async () => {
        const amount = parseFloat(elements.investmentAmountInput.value);
        const interestRate = parseFloat(elements.interestRateInput.value);
        const date = elements.investmentDateInput.value || new Date().toISOString().split('T')[0];
        
        if (!amount || amount <= 0) {
            alert('Por favor, insira um valor válido');
            return;
        }
        
        if (!interestRate || interestRate <= 0) {
            alert('Por favor, insira uma taxa de juros válida');
            return;
        }
        
        state.investments.push({
            amount,
            interestRate,
            date
        });
        
        // Também adiciona como despesa
        state.expenses.push({
            amount,
            category: 'investment',
            date,
            description: 'Investimento financeiro'
        });
        
        console.log('Novo investimento adicionado:', state.investments[state.investments.length - 1]);
        
        try {
            await saveData();
            updateUI();
            elements.investmentAmountInput.value = '';
            elements.investmentModal.style.display = 'none';
        } catch (error) {
            console.error('Erro ao adicionar investimento:', error);
            alert('Erro ao salvar investimento');
        }
    });
    
    // Exportar para Excel
    elements.exportExcelBtn.addEventListener('click', exportToExcel);
}

function exportToExcel() {
    // Verificar se a biblioteca SheetJS está carregada
    if (typeof XLSX === 'undefined') {
        alert('A biblioteca de exportação ainda não foi carregada. Por favor, aguarde e tente novamente.');
        return;
    }

    // Criar um workbook
    const workbook = XLSX.utils.book_new();
    
    // Criar planilha de entradas
    const incomesData = state.incomes.map(income => ({
        Data: formatDate(income.date),
        Tipo: income.type === 'salary' ? 'Salário' : 'Flash',
        Valor: income.amount,
        Mês: income.month,
        Ano: income.year
    }));
    
    const incomesSheet = XLSX.utils.json_to_sheet(incomesData);
    XLSX.utils.book_append_sheet(workbook, incomesSheet, 'Entradas');
    
    // Criar planilha de gastos
    const expensesData = state.expenses.map(expense => ({
        Data: formatDate(expense.date),
        Categoria: getExpenseCategoryName(expense.category),
        Descrição: expense.description || '-',
        Valor: expense.amount
    }));
    
    const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos');
    
    // Criar planilha de investimentos
    const investmentsData = state.investments.map(investment => ({
        Data: formatDate(investment.date),
        'Valor Investido': investment.amount,
        'Taxa de Juros': investment.interestRate,
        'Valor Atual': calculateCurrentInvestmentValue(investment)
    }));
    
    const investmentsSheet = XLSX.utils.json_to_sheet(investmentsData);
    XLSX.utils.book_append_sheet(workbook, investmentsSheet, 'Investimentos');
    
    // Adicionar resumo
    const summaryData = [{
        'Total Entradas': state.incomes.reduce((sum, income) => sum + income.amount, 0),
        'Total Gastos': state.expenses.reduce((sum, expense) => sum + expense.amount, 0),
        'Saldo Atual': state.balance,
        'Total Investido': calculateCompoundInterest(state.investments).totalInvested,
        'Valor Acumulado Investimentos': calculateCompoundInterest(state.investments).totalValue,
        'Rendimento': calculateCompoundInterest(state.investments).earnings
    }];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
    
    // Exportar
    XLSX.writeFile(workbook, 'controle_gastos.xlsx');
}

// Inicialização
// Modifique o evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando aplicação');
    
    // Inicializa estado seguro
    initializeSafeState();
    
    // Configurar datas padrão
    const today = new Date();
    elements.incomeDateInput.value = today.toISOString().split('T')[0];
    elements.expenseDateInput.value = today.toISOString().split('T')[0];
    elements.investmentDateInput.value = today.toISOString().split('T')[0];
    
    // Configurar mês e ano atual
    elements.monthSelect.value = today.getMonth() + 1;
    elements.yearInput.value = today.getFullYear();
    
    setupEventListeners();
    loadData();
});

// Adicionar a biblioteca SheetJS para exportar para Excel
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
document.head.appendChild(script);

// Adicione estas funções ao script.js
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    const icon = notification.querySelector('.material-icons');
    
    messageElement.textContent = message;
    notification.className = isError ? 'notification error show' : 'notification show';
    icon.textContent = isError ? 'error' : 'check_circle';
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}