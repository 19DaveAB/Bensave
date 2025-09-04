// Global Variables
let currentBalance = 0;
let weeklyBudget = 0;
let weeklySpent = 0;
let budgetStartDate = null;
let savingsGoal = 0;
let savedAmount = 0;
let currentProvider = '';
let transactionType = 'deposit';

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromStorage();
    updateDisplay();
    setMinDateForSavings();
});

// Tab Management (replaced with enhanced version at bottom of file)

// Budget Functions
function setBudget() {
    const budgetInput = document.getElementById('weeklyBudget');
    const amount = parseFloat(budgetInput.value);
    
    if (!amount || amount <= 0) {
        showAlert('Invalid Budget', 'Please enter a valid budget amount.');
        return;
    }
    
    weeklyBudget = amount;
    budgetStartDate = new Date();
    weeklySpent = 0;
    
    // Show budget display
    document.getElementById('budgetDisplay').style.display = 'block';
    document.getElementById('budgetDisplay').classList.add('animate-in');
    
    updateBudgetDisplay();
    saveDataToStorage();
    
    showAlert('Budget Set!', `Your weekly budget of ₵${formatCurrency(amount)} has been set successfully!`);
    budgetInput.value = '';
}

function addExpense() {
    const amountInput = document.getElementById('expenseAmount');
    const descriptionInput = document.getElementById('expenseDescription');
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    
    if (!amount || amount <= 0) {
        showAlert('Invalid Amount', 'Please enter a valid expense amount.');
        return;
    }
    
    if (!description) {
        showAlert('Description Required', 'Please describe what you bought.');
        return;
    }
    
    if (weeklyBudget === 0) {
        showAlert('No Budget Set', 'Please set a weekly budget first.');
        return;
    }
    
    // Check if expense exceeds remaining budget
    const newWeeklySpent = weeklySpent + amount;
    
    if (newWeeklySpent > weeklyBudget) {
        showAlert('Budget Exceeded!', `This expense will exceed your weekly budget by ₵${formatCurrency(newWeeklySpent - weeklyBudget)}. Transaction cancelled to protect your savings goal.`);
        return;
    }
    
    // Check if expense is too close to budget limit
    const remainingAfter = weeklyBudget - newWeeklySpent;
    if (remainingAfter < weeklyBudget * 0.1) { // Less than 10% remaining
        if (!confirm(`Warning: This expense will leave you with only ₵${formatCurrency(remainingAfter)} remaining for the week. Continue?`)) {
            return;
        }
    }
    
    weeklySpent = newWeeklySpent;
    currentBalance -= amount;
    
    updateBudgetDisplay();
    updateDisplay();
    saveDataToStorage();
    
    showAlert('Expense Added', `₵${formatCurrency(amount)} spent on "${description}".`);
    
    amountInput.value = '';
    descriptionInput.value = '';
}

function updateBudgetDisplay() {
    const remaining = weeklyBudget - weeklySpent;
    const percentage = (weeklySpent / weeklyBudget) * 100;
    
    document.getElementById('weeklyBudgetAmount').textContent = '₵' + formatCurrency(weeklyBudget);
    document.getElementById('weeklySpent').textContent = '₵' + formatCurrency(weeklySpent);
    document.getElementById('budgetRemaining').textContent = '₵' + formatCurrency(remaining);
    
    // Update progress bar
    const progressBar = document.getElementById('budgetProgress');
    progressBar.style.width = Math.min(percentage, 100) + '%';
    
    // Update budget status
    const statusElement = document.getElementById('budgetStatus');
    statusElement.classList.remove('safe', 'warning', 'danger');
    
    if (percentage >= 100) {
        statusElement.textContent = '⚠️ Budget Exceeded! Consider reducing expenses.';
        statusElement.classList.add('danger');
        progressBar.style.background = 'linear-gradient(90deg, #dc3545, #ff6b6b)';
    } else if (percentage >= 80) {
        statusElement.textContent = '⚠️ Close to budget limit. Spend carefully!';
        statusElement.classList.add('warning');
        progressBar.style.background = 'linear-gradient(90deg, #ffc107, #ffed4e)';
    } else if (percentage >= 60) {
        statusElement.textContent = '⚡ Over halfway through your budget.';
        statusElement.classList.add('warning');
    } else {
        statusElement.textContent = '✅ You\'re doing great! Keep it up!';
        statusElement.classList.add('safe');
        progressBar.style.background = 'linear-gradient(90deg, #006600, #00AA00)';
    }
}

// Mobile Money Functions
function selectProvider(provider) {
    currentProvider = provider;
    
    const providerNames = {
        'mtn': 'MTN Mobile Money',
        'telecel': 'Telecel Cash',
        'airtel-tigo': 'AirtelTigo Money'
    };
    
    document.getElementById('providerTitle').textContent = providerNames[provider];
    document.getElementById('mobileMoneyForm').style.display = 'block';
    document.getElementById('mobileMoneyForm').classList.add('animate-in');
    
    // Reset form
    document.getElementById('phoneNumber').value = '';
    document.getElementById('transactionAmount').value = '';
}

function setTransactionType(type) {
    transactionType = type;
    
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update button text
    const btnText = type === 'deposit' ? 'Deposit Money' : 'Withdraw Money';
    document.getElementById('transactionBtn').textContent = btnText;
}

function processMobileMoneyTransaction() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    
    // Validation
    if (!phoneNumber || !isValidGhanaianNumber(phoneNumber)) {
        showAlert('Invalid Phone Number', 'Please enter a valid Ghanaian phone number (0xxxxxxxxx).');
        return;
    }
    
    if (!amount || amount <= 0) {
        showAlert('Invalid Amount', 'Please enter a valid transaction amount.');
        return;
    }
    
    // Check balance for withdrawals
    if (transactionType === 'withdraw' && amount > currentBalance) {
        showAlert('Insufficient Balance', `You cannot withdraw ₵${formatCurrency(amount)}. Your current balance is ₵${formatCurrency(currentBalance)}.`);
        return;
    }
    
    // Send prompt to user's phone
    const providerName = currentProvider.toUpperCase().replace('-', '');
    const actionText = transactionType === 'deposit' ? 'deposit' : 'withdraw';
    showAlert('Prompt Sent!', `A prompt has been sent to ${phoneNumber} via ${providerName}. Please check your phone and approve the ${actionText} of ₵${formatCurrency(amount)}.`);
    
    // Simulate waiting for user approval on their device
    setTimeout(() => {
        const approved = Math.random() > 0.2; // 80% approval rate (some users might decline or timeout)
        
        if (approved) {
            if (transactionType === 'deposit') {
                currentBalance += amount;
                savedAmount += amount; // Deposits count as savings
                showAlert('Transaction Approved!', `₵${formatCurrency(amount)} has been deposited to your Bensave account via ${providerName}. Thank you for approving the transaction on your device.`);
            } else {
                currentBalance -= amount;
                showAlert('Transaction Approved!', `₵${formatCurrency(amount)} has been withdrawn from your Bensave account via ${providerName}. Thank you for approving the transaction on your device.`);
            }
            
            updateDisplay();
            updateSavingsDisplay();
            saveDataToStorage();
            
            // Clear form
            document.getElementById('phoneNumber').value = '';
            document.getElementById('transactionAmount').value = '';
            
        } else {
            showAlert('Transaction Declined', 'The transaction was declined, cancelled, or timed out on your device. Please try again if needed.');
        }
    }, 3000); // 3 second delay to simulate user approval time
}

function isValidGhanaianNumber(number) {
    // Basic validation for Ghanaian phone numbers
    const pattern = /^0[2-9][0-9]{8}$/;
    return pattern.test(number);
}

// Savings Functions
function setSavingsGoal() {
    const goalInput = document.getElementById('savingsGoal');
    const deadlineInput = document.getElementById('savingsDeadline');
    
    const goal = parseFloat(goalInput.value);
    const deadline = deadlineInput.value;
    
    if (!goal || goal <= 0) {
        showAlert('Invalid Goal', 'Please enter a valid savings goal amount.');
        return;
    }
    
    if (!deadline) {
        showAlert('Deadline Required', 'Please set a target date for your savings goal.');
        return;
    }
    
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
        showAlert('Invalid Date', 'Please choose a future date for your savings goal.');
        return;
    }
    
    savingsGoal = goal;
    
    // Show savings display
    document.getElementById('savingsDisplay').style.display = 'block';
    document.getElementById('savingsDisplay').classList.add('animate-in');
    
    updateSavingsDisplay();
    saveDataToStorage();
    
    showAlert('Savings Goal Set!', `Your savings goal of ₵${formatCurrency(goal)} has been set successfully!`);
    
    goalInput.value = '';
    deadlineInput.value = '';
}

function updateSavingsDisplay() {
    const remaining = Math.max(0, savingsGoal - savedAmount);
    const percentage = savingsGoal > 0 ? (savedAmount / savingsGoal) * 100 : 0;
    
    document.getElementById('targetAmount').textContent = '₵' + formatCurrency(savingsGoal);
    document.getElementById('savedAmount').textContent = '₵' + formatCurrency(savedAmount);
    document.getElementById('remainingAmount').textContent = '₵' + formatCurrency(remaining);
    
    // Update progress bar
    const progressBar = document.getElementById('savingsProgress');
    progressBar.style.width = Math.min(percentage, 100) + '%';
    
    if (percentage >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #28a745, #34ce57)';
    }
}

function setMinDateForSavings() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = document.getElementById('savingsDeadline');
    dateInput.min = tomorrow.toISOString().split('T')[0];
}

// Currency Converter Functions
// Offline exchange rates as fallback (approximate rates as of September 2025)
const fallbackRates = {
    USD: 11.89,
    EUR: 13.12,
    GBP: 14.98,
    NGN: 0.0074,
    ZAR: 0.66,
    CAD: 8.72,
    AUD: 7.98,
    JPY: 0.082,
    CNY: 1.67,
    INR: 0.14
};

async function convertCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const amount = parseFloat(document.getElementById('convertAmount').value);
    
    if (!amount || amount <= 0) {
        showAlert('Invalid Amount', 'Please enter a valid amount to convert.');
        return;
    }
    
    showAlert('Converting...', 'Getting exchange rates...');
    
    let exchangeRate;
    let isOnlineRate = false;
    
    try {
        // First try online API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=GHS`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.success && data.rates && data.rates.GHS) {
            exchangeRate = data.rates.GHS;
            isOnlineRate = true;
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.log('Using fallback rates due to:', error.message);
        // Use fallback rates
        exchangeRate = fallbackRates[fromCurrency];
        isOnlineRate = false;
    }
    
    if (!exchangeRate) {
        showAlert('Conversion Error', 'Exchange rate not available for this currency. Please try a different currency.');
        return;
    }
    
    const convertedAmount = amount * exchangeRate;
    
    // Update display
    document.getElementById('fromAmount').textContent = `${formatCurrency(amount)} ${fromCurrency}`;
    document.getElementById('toAmount').textContent = `₵${formatCurrency(convertedAmount)}`;
    document.getElementById('exchangeRateInfo').textContent = `1 ${fromCurrency} = ₵${formatCurrency(exchangeRate)}`;
    document.getElementById('convertedValue').textContent = formatCurrency(convertedAmount);
    
    // Show rate source
    const rateSource = isOnlineRate ? 'Live rates' : 'Offline rates';
    document.getElementById('lastUpdated').textContent = `${rateSource} • ${new Date().toLocaleDateString()}`;
    
    // Show result
    document.getElementById('conversionResult').style.display = 'block';
    document.getElementById('conversionResult').classList.add('animate-in');
    
    // Store converted value for adding to balance
    window.lastConvertedAmount = convertedAmount;
    
    closeModal();
}

function addConvertedAmount() {
    if (window.lastConvertedAmount) {
        currentBalance += window.lastConvertedAmount;
        savedAmount += window.lastConvertedAmount; // Converted money counts as savings
        
        updateDisplay();
        updateSavingsDisplay();
        saveDataToStorage();
        
        showAlert('Money Added!', `₵${formatCurrency(window.lastConvertedAmount)} has been added to your Bensave balance!`);
        
        // Reset form
        document.getElementById('convertAmount').value = '1';
        document.getElementById('conversionResult').style.display = 'none';
        window.lastConvertedAmount = null;
    }
}

// Utility Functions
function updateDisplay() {
    document.getElementById('currentBalance').textContent = '₵' + formatCurrency(currentBalance);
    
    // Check if budget needs to be reset (new week)
    if (budgetStartDate) {
        const daysSinceBudgetStart = Math.floor((new Date() - budgetStartDate) / (1000 * 60 * 60 * 24));
        if (daysSinceBudgetStart >= 7) {
            resetWeeklyBudget();
        }
    }
}

function resetWeeklyBudget() {
    weeklySpent = 0;
    budgetStartDate = new Date();
    updateBudgetDisplay();
    saveDataToStorage();
    showAlert('New Week!', 'Your weekly budget has been reset. Time for a fresh start!');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function showAlert(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('alertModal').style.display = 'none';
}

// Data Persistence
function saveDataToStorage() {
    const data = {
        currentBalance,
        weeklyBudget,
        weeklySpent,
        budgetStartDate: budgetStartDate ? budgetStartDate.getTime() : null,
        savingsGoal,
        savedAmount
    };
    localStorage.setItem('bensaveData', JSON.stringify(data));
}

function loadDataFromStorage() {
    const savedData = localStorage.getItem('bensaveData');
    if (savedData) {
        const data = JSON.parse(savedData);
        currentBalance = data.currentBalance || 0;
        weeklyBudget = data.weeklyBudget || 0;
        weeklySpent = data.weeklySpent || 0;
        budgetStartDate = data.budgetStartDate ? new Date(data.budgetStartDate) : null;
        savingsGoal = data.savingsGoal || 0;
        savedAmount = data.savedAmount || 0;
        
        // Show displays if data exists
        if (weeklyBudget > 0) {
            document.getElementById('budgetDisplay').style.display = 'block';
            updateBudgetDisplay();
        }
        
        if (savingsGoal > 0) {
            document.getElementById('savingsDisplay').style.display = 'block';
            updateSavingsDisplay();
        }
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('alertModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Prevent form submission on Enter key in inputs
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
        event.preventDefault();
        
        // Find the submit button in the same card
        const card = event.target.closest('.card');
        if (card) {
            const submitBtn = card.querySelector('.btn-primary, .btn-secondary');
            if (submitBtn) {
                submitBtn.click();
            }
        }
    }
});

// Add loading states to buttons
function addLoadingState(button) {
    const originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Initialize currency converter on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default values for currency converter
    const convertAmountInput = document.getElementById('convertAmount');
    if (convertAmountInput) {
        convertAmountInput.addEventListener('input', function() {
            // Hide result when user changes amount
            document.getElementById('conversionResult').style.display = 'none';
        });
    }
    
    const fromCurrencySelect = document.getElementById('fromCurrency');
    if (fromCurrencySelect) {
        fromCurrencySelect.addEventListener('change', function() {
            // Hide result when user changes currency
            document.getElementById('conversionResult').style.display = 'none';
        });
    }
});

// Enhanced tab switching with proper navigation handling
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab and activate button
    document.getElementById(tabName).classList.add('active');
    
    // Find and activate the correct nav button
    navBtns.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.replace('-', ' ')) || 
            (tabName === 'converter' && btn.textContent.toLowerCase().includes('currency'))) {
            btn.classList.add('active');
        }
    });
}