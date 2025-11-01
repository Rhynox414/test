// Global Variables
let tripHistory = [];
let mileageChart = null;
let costChart = null;
let usageChart = null;

// Unit Conversion Constants
const CONVERSIONS = {
    milesToKm: 1.60934,
    kmToMiles: 0.621371,
    gallonsToLitres: 3.78541,
    litresToGallons: 0.264172
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadHistory();
    setupEventListeners();
    initializeCharts();
    updateDisplay();
}

// Event Listeners Setup
function setupEventListeners() {
    const form = document.getElementById('mileageForm');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const vehicleFilter = document.getElementById('vehicleFilter');
    const fuelUnit = document.getElementById('fuelUnit');
    const distanceUnit = document.getElementById('distanceUnit');

    form.addEventListener('submit', handleFormSubmit);
    saveBtn.addEventListener('click', saveCurrentCalculation);
    resetBtn.addEventListener('click', resetForm);
    clearHistoryBtn.addEventListener('click', clearHistory);
    vehicleFilter.addEventListener('change', filterHistory);
    fuelUnit.addEventListener('change', updatePriceUnit);
    distanceUnit.addEventListener('change', updatePriceUnit);
}

// Form Submission Handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
        calculateMileage();
    }
}

// Form Validation
function validateForm() {
    const distance = parseFloat(document.getElementById('distance').value);
    const fuelUsed = parseFloat(document.getElementById('fuelUsed').value);
    const fuelPrice = document.getElementById('fuelPrice').value;
    
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Validate distance
    if (!distance || distance <= 0) {
        showError('distanceError', 'Please enter a valid distance greater than 0');
        document.getElementById('distance').classList.add('error');
        isValid = false;
    }
    
    // Validate fuel used
    if (!fuelUsed || fuelUsed <= 0) {
        showError('fuelError', 'Please enter a valid fuel amount greater than 0');
        document.getElementById('fuelUsed').classList.add('error');
        isValid = false;
    }
    
    // Validate fuel price (optional, but if entered must be valid)
    if (fuelPrice && (isNaN(parseFloat(fuelPrice)) || parseFloat(fuelPrice) < 0)) {
        showError('priceError', 'Please enter a valid fuel price');
        document.getElementById('fuelPrice').classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

// Update Price Unit Display
function updatePriceUnit() {
    const fuelUnit = document.getElementById('fuelUnit').value;
    const priceUnitDisplay = document.getElementById('priceUnitDisplay');
    priceUnitDisplay.textContent = `per ${fuelUnit === 'litres' ? 'litre' : 'gallon'}`;
}


// Calculate Mileage
function calculateMileage() {
    const distance = parseFloat(document.getElementById('distance').value);
    const fuelUsed = parseFloat(document.getElementById('fuelUsed').value);
    const fuelPrice = document.getElementById('fuelPrice').value ? parseFloat(document.getElementById('fuelPrice').value) : null;
    const distanceUnit = document.getElementById('distanceUnit').value;
    const fuelUnit = document.getElementById('fuelUnit').value;
    
    // Convert to standard units (km and litres) for calculation
    let distanceKm = distance;
    let fuelLitres = fuelUsed;
    
    if (distanceUnit === 'miles') {
        distanceKm = distance * CONVERSIONS.milesToKm;
    }
    
    if (fuelUnit === 'gallons') {
        fuelLitres = fuelUsed * CONVERSIONS.gallonsToLitres;
    }
    
    // Calculate mileage (km per litre)
    const mileageKmPerLitre = distanceKm / fuelLitres;
    
    // Display mileage in user's preferred unit
    let mileageResult, mileageUnit;
    if (distanceUnit === 'km' && fuelUnit === 'litres') {
        mileageResult = mileageKmPerLitre.toFixed(2);
        mileageUnit = 'km/litre';
    } else if (distanceUnit === 'miles' && fuelUnit === 'gallons') {
        mileageResult = (mileageKmPerLitre * CONVERSIONS.kmToMiles / CONVERSIONS.litresToGallons).toFixed(2);
        mileageUnit = 'miles/gallon';
    } else {
        // Mixed units - show both
        mileageResult = mileageKmPerLitre.toFixed(2);
        mileageUnit = 'km/litre';
    }
    
    // Calculate trip cost if fuel price provided
    let tripCost = null;
    let costPerKm = null;
    
    if (fuelPrice !== null && fuelPrice > 0) {
        // Convert fuel price to per litre if needed
        let pricePerLitre = fuelPrice;
        if (fuelUnit === 'gallons') {
            pricePerLitre = fuelPrice / CONVERSIONS.gallonsToLitres;
        }
        
        const fuelUsedForTrip = distanceKm / mileageKmPerLitre;
        tripCost = fuelUsedForTrip * pricePerLitre;
        
        costPerKm = pricePerLitre / mileageKmPerLitre;
    }
    
    // Display results
    displayResults(mileageResult, mileageUnit, tripCost, costPerKm, distanceUnit);
    
    // Store current calculation for saving
    window.currentCalculation = {
        distance,
        distanceUnit,
        fuelUsed,
        fuelUnit,
        fuelPrice,
        mileage: mileageKmPerLitre,
        mileageDisplay: mileageResult,
        mileageUnitDisplay: mileageUnit,
        tripCost,
        costPerKm,
        vehicleName: document.getElementById('vehicleName').value || 'Unnamed Vehicle',
        timestamp: new Date().toISOString()
    };
}

// Display Results
function displayResults(mileage, mileageUnit, tripCost, costPerKm, distanceUnit) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // Animate results
    animateValue('mileageResult', 0, parseFloat(mileage), 500);
    document.getElementById('mileageUnit').textContent = mileageUnit;
    
    if (tripCost !== null) {
        animateValue('tripCostResult', 0, tripCost, 500);
        document.getElementById('tripCostUnit').textContent = 'currency';
    } else {
        document.getElementById('tripCostResult').textContent = 'N/A';
        document.getElementById('tripCostUnit').textContent = 'Enter fuel price';
    }
    
    if (costPerKm !== null) {
        animateValue('costPerKmResult', 0, costPerKm, 500);
        document.getElementById('costPerKmUnit').textContent = `per ${distanceUnit === 'km' ? 'km' : 'mile'}`;
    } else {
        document.getElementById('costPerKmResult').textContent = 'N/A';
        document.getElementById('costPerKmUnit').textContent = 'Enter fuel price';
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Animate Value Counter
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end.toFixed(2);
            element.classList.add('animated');
            clearInterval(timer);
        } else {
            element.textContent = current.toFixed(2);
        }
    }, 16);
}

// Save Current Calculation to History
function saveCurrentCalculation() {
    if (!window.currentCalculation) {
        alert('Please calculate mileage first!');
        return;
    }
    
    // Add unique ID for reliable deletion
    const tripWithId = { 
        ...window.currentCalculation,
        id: Date.now() + Math.random()
    };
    tripHistory.push(tripWithId);
    saveHistory();
    updateDisplay();
    updateCharts();
    
    // Show success message
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
}

// Reset Form
function resetForm() {
    document.getElementById('mileageForm').reset();
    document.getElementById('resultsSection').style.display = 'none';
    clearErrors();
    window.currentCalculation = null;
    updatePriceUnit();
}

// LocalStorage Functions
function loadHistory() {
    const saved = localStorage.getItem('mileageCalculatorHistory');
    if (saved) {
        tripHistory = JSON.parse(saved);
        // Assign IDs to legacy trips that don't have one
        tripHistory.forEach((trip, index) => {
            if (!trip.id) {
                trip.id = Date.now() + index;
            }
        });
        // Save back if we added IDs
        if (tripHistory.some(trip => !trip.hasOwnProperty('id'))) {
            saveHistory();
        }
    }
}

function saveHistory() {
    localStorage.setItem('mileageCalculatorHistory', JSON.stringify(tripHistory));
}

// Update Display
function updateDisplay() {
    updateHistoryTable();
    updateStatistics();
    updateVehicleFilter();
}

// Update History Table
function updateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const vehicleFilter = document.getElementById('vehicleFilter').value;
    
    let filteredHistory = tripHistory;
    if (vehicleFilter !== 'all') {
        filteredHistory = tripHistory.filter(trip => trip.vehicleName === vehicleFilter);
    }
    
    if (filteredHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No trip history yet. Calculate and save your first trip!</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(trip => {
            const date = new Date(trip.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Use trip.id or find original index in main array before sorting
            const tripId = trip.id || tripHistory.findIndex(t => 
                t.timestamp === trip.timestamp && 
                t.distance === trip.distance && 
                t.fuelUsed === trip.fuelUsed
            );
            
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${trip.vehicleName}</td>
                    <td>${trip.distance.toFixed(2)} ${trip.distanceUnit}</td>
                    <td>${trip.fuelUsed.toFixed(2)} ${trip.fuelUnit}</td>
                    <td>${trip.mileageDisplay} ${trip.mileageUnitDisplay}</td>
                    <td>${trip.tripCost !== null ? trip.tripCost.toFixed(2) : 'N/A'}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteTripById(${tripId})">Delete</button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Delete Trip by ID
function deleteTripById(tripId) {
    if (confirm('Are you sure you want to delete this trip?')) {
        // First try to delete by ID
        const filtered = tripHistory.filter(trip => {
            if (trip.id !== undefined) {
                return trip.id !== tripId;
            }
            // For legacy trips without ID, check if index matches
            return tripHistory.indexOf(trip) !== tripId;
        });
        
        // If no change, try numeric index (for legacy support)
        if (filtered.length === tripHistory.length && typeof tripId === 'number' && tripId >= 0) {
            tripHistory.splice(tripId, 1);
        } else {
            tripHistory = filtered;
        }
        
        saveHistory();
        updateDisplay();
        updateCharts();
    }
}

// Legacy function for backward compatibility
function deleteTrip(index) {
    if (confirm('Are you sure you want to delete this trip?')) {
        tripHistory.splice(index, 1);
        saveHistory();
        updateDisplay();
        updateCharts();
    }
}

// Filter History
function filterHistory() {
    updateHistoryTable();
}

// Update Vehicle Filter Dropdown
function updateVehicleFilter() {
    const vehicleFilter = document.getElementById('vehicleFilter');
    const currentValue = vehicleFilter.value;
    
    const vehicles = [...new Set(tripHistory.map(trip => trip.vehicleName))];
    
    vehicleFilter.innerHTML = '<option value="all">All Vehicles</option>' +
        vehicles.map(vehicle => `<option value="${vehicle}">${vehicle}</option>`).join('');
    
    vehicleFilter.value = currentValue || 'all';
}

// Clear All History
function clearHistory() {
    if (confirm('Are you sure you want to clear all trip history? This cannot be undone.')) {
        tripHistory = [];
        saveHistory();
        updateDisplay();
        updateCharts();
    }
}

// Update Statistics
function updateStatistics() {
    if (tripHistory.length === 0) {
        document.getElementById('totalTrips').textContent = '0';
        document.getElementById('avgMileage').textContent = '0';
        document.getElementById('avgMileageUnit').textContent = '';
        document.getElementById('totalDistance').textContent = '0';
        document.getElementById('totalDistanceUnit').textContent = '';
        document.getElementById('totalCost').textContent = '0';
        document.getElementById('totalCostUnit').textContent = '';
        return;
    }
    
    const totalTrips = tripHistory.length;
    
    // Calculate average mileage (convert all to km/litre first)
    const totalMileage = tripHistory.reduce((sum, trip) => sum + trip.mileage, 0);
    const avgMileage = totalMileage / totalTrips;
    
    // Calculate total distance (convert all to km)
    const totalDistanceKm = tripHistory.reduce((sum, trip) => {
        let distanceKm = trip.distance;
        if (trip.distanceUnit === 'miles') {
            distanceKm = trip.distance * CONVERSIONS.milesToKm;
        }
        return sum + distanceKm;
    }, 0);
    
    // Calculate total cost (only trips with cost)
    const tripsWithCost = tripHistory.filter(trip => trip.tripCost !== null);
    const totalCost = tripsWithCost.reduce((sum, trip) => sum + trip.tripCost, 0);
    
    // Update display
    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('avgMileage').textContent = avgMileage.toFixed(2);
    document.getElementById('avgMileageUnit').textContent = 'km/litre';
    document.getElementById('totalDistance').textContent = totalDistanceKm.toFixed(2);
    document.getElementById('totalDistanceUnit').textContent = 'km';
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    document.getElementById('totalCostUnit').textContent = tripsWithCost.length > 0 ? 'currency' : 'N/A';
}

// Initialize Charts
function initializeCharts() {
    const mileageCtx = document.getElementById('mileageChart').getContext('2d');
    const costCtx = document.getElementById('costChart').getContext('2d');
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0e0'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#e0e0e0' },
                grid: { color: '#2d4a44' }
            },
            y: {
                ticks: { color: '#e0e0e0' },
                grid: { color: '#2d4a44' }
            }
        }
    };
    
    // Mileage Trend Chart (Line Chart)
    mileageChart = new Chart(mileageCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Mileage (km/litre)',
                data: [],
                borderColor: '#cd853f',
                backgroundColor: 'rgba(205, 133, 63, 0.15)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: false
                }
            }
        }
    });
    
    // Cost Comparison Chart (Bar Chart)
    costChart = new Chart(costCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Trip Cost',
                data: [],
                backgroundColor: 'rgba(160, 82, 45, 0.8)',
                borderColor: '#a0522d',
                borderWidth: 2
            }]
        },
        options: chartOptions
    });
    
    // Usage Distribution Chart (Doughnut Chart)
    usageChart = new Chart(usageCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#a0522d',
                    '#cd853f',
                    '#8b4513',
                    '#d2691e',
                    '#b8860b',
                    '#daa520'
                ],
                borderColor: '#24403a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15
                    }
                }
            }
        }
    });
    
    updateCharts();
}

// Update Charts with Data
function updateCharts() {
    if (tripHistory.length === 0) {
        // Clear charts
        mileageChart.data.labels = [];
        mileageChart.data.datasets[0].data = [];
        mileageChart.update();
        
        costChart.data.labels = [];
        costChart.data.datasets[0].data = [];
        costChart.update();
        
        usageChart.data.labels = [];
        usageChart.data.datasets[0].data = [];
        usageChart.update();
        return;
    }
    
    // Sort by date
    const sortedHistory = [...tripHistory].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Mileage Trend Chart
    mileageChart.data.labels = sortedHistory.map((trip, index) => 
        `Trip ${index + 1}`
    );
    mileageChart.data.datasets[0].data = sortedHistory.map(trip => trip.mileage);
    mileageChart.update();
    
    // Cost Comparison Chart (only trips with cost)
    const tripsWithCost = sortedHistory.filter(trip => trip.tripCost !== null);
    if (tripsWithCost.length > 0) {
        costChart.data.labels = tripsWithCost.map((trip, index) => 
            `Trip ${sortedHistory.indexOf(trip) + 1}`
        );
        costChart.data.datasets[0].data = tripsWithCost.map(trip => trip.tripCost);
        costChart.update();
    } else {
        costChart.data.labels = [];
        costChart.data.datasets[0].data = [];
        costChart.update();
    }
    
    // Fuel Usage Distribution by Vehicle
    const vehicleUsage = {};
    sortedHistory.forEach(trip => {
        const vehicle = trip.vehicleName;
        if (!vehicleUsage[vehicle]) {
            vehicleUsage[vehicle] = 0;
        }
        // Convert fuel to litres for consistency
        let fuelLitres = trip.fuelUsed;
        if (trip.fuelUnit === 'gallons') {
            fuelLitres = trip.fuelUsed * CONVERSIONS.gallonsToLitres;
        }
        vehicleUsage[vehicle] += fuelLitres;
    });
    
    usageChart.data.labels = Object.keys(vehicleUsage);
    usageChart.data.datasets[0].data = Object.values(vehicleUsage);
    usageChart.update();
}
