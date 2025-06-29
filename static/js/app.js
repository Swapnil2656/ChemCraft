// Global variables
let elementsData = [];
let currentQuiz = null;
let score = 0;
let questionCount = 0;
let selectedElements = [];
let compoundsData = [];

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadElements();
    loadCompounds();
    setupEventListeners();
});

// Load elements data from API
async function loadElements() {
    try {
        console.log('Loading elements...');
        const response = await fetch('/api/elements');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Elements data loaded:', data);

        // Handle both direct array and nested structure
        if (Array.isArray(data)) {
            elementsData = data;
        } else if (data.elements && Array.isArray(data.elements)) {
            elementsData = data.elements;
        } else {
            console.error('Unexpected data structure:', data);
            elementsData = [];
        }

        console.log('Elements array length:', elementsData.length);
        renderPeriodicTable();
        renderMiniPeriodicTable();
    } catch (error) {
        console.error('Error loading elements:', error);
        elementsData = [];
    }
}

// Load compounds data from API
async function loadCompounds() {
    try {
        const response = await fetch('/api/compounds');
        const data = await response.json();
        compoundsData = data.compounds;
    } catch (error) {
        console.error('Error loading compounds:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTab(tabName);
        });
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('element-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Quiz controls
    document.getElementById('new-question-btn').addEventListener('click', loadNewQuestion);

    // Search functionality
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Compound mixer functionality
    document.getElementById('mix-elements-btn').addEventListener('click', mixElements);
    document.getElementById('clear-selection-btn').addEventListener('click', clearSelection);
    document.getElementById('random-compound-btn').addEventListener('click', showRandomCompound);
}

// Tab switching function
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

// Render periodic table
function renderPeriodicTable() {
    console.log('Rendering periodic table...');
    const tableContainer = document.getElementById('periodic-table-grid');
    console.log('Table container found:', tableContainer);

    if (!tableContainer) {
        console.error('Periodic table container not found!');
        return;
    }

    if (!elementsData || elementsData.length === 0) {
        console.error('No elements data available!');
        tableContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error: No elements data loaded. Please refresh the page.</p>';
        return;
    }

    tableContainer.innerHTML = '';
    console.log('Elements data length:', elementsData.length);
    console.log('First element:', elementsData[0]);

    // Create grid with proper positioning
    let elementsCreated = 0;

    elementsData.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.className = `element ${getCategoryClass(element.category)}`;

        console.log(`Creating element ${element.symbol} (${element.name})`);

        // Handle special positioning for lanthanides and actinides
        if (element.category === 'lanthanide') {
            // Lanthanum (57) should appear in the main grid at (6,3)
            if (element.number === 57) {
                elementDiv.style.gridColumn = element.group || 3;
                elementDiv.style.gridRow = element.period || 6;
            } else {
                // Other lanthanides go in row 8
                elementDiv.style.gridColumn = element.number - 54; // Offset for lanthanides
                elementDiv.style.gridRow = 8; // Separate row for lanthanides
            }
        } else if (element.category === 'actinide') {
            // Actinium (89) should appear in the main grid at (7,3)
            if (element.number === 89) {
                elementDiv.style.gridColumn = element.group || 3;
                elementDiv.style.gridRow = element.period || 7;
            } else {
                // Other actinides go in row 9
                elementDiv.style.gridColumn = element.number - 86; // Offset for actinides
                elementDiv.style.gridRow = 9; // Separate row for actinides
            }
        } else {
            // Normal positioning
            const column = element.group || 'auto';
            const row = element.period || 'auto';
            elementDiv.style.gridColumn = column;
            elementDiv.style.gridRow = row;

            // Debug positioning for first few elements
            if (element.number <= 5) {
                console.log(`Element ${element.symbol}: group=${element.group}, period=${element.period}, column=${column}, row=${row}`);
            }
        }

        elementDiv.innerHTML = `
            <div class="number">${element.number}</div>
            <div class="symbol">${element.symbol}</div>
            <div class="name">${element.name}</div>
        `;

        elementDiv.addEventListener('click', () => showElementDetails(element));
        tableContainer.appendChild(elementDiv);
        elementsCreated++;
    });

    console.log(`Periodic table rendered with ${elementsCreated} elements`);
    console.log('Table container children count:', tableContainer.children.length);

    // If no elements were created, show an error message and try simple rendering
    if (elementsCreated === 0) {
        console.error('No elements were created, trying simple rendering...');
        tableContainer.innerHTML = '';

        // Try simple rendering without grid positioning
        elementsData.slice(0, 10).forEach((element, index) => {
            const simpleDiv = document.createElement('div');
            simpleDiv.className = 'element';
            simpleDiv.style.display = 'inline-block';
            simpleDiv.style.margin = '5px';
            simpleDiv.innerHTML = `
                <div class="number">${element.number}</div>
                <div class="symbol">${element.symbol}</div>
                <div class="name">${element.name}</div>
            `;
            simpleDiv.addEventListener('click', () => showElementDetails(element));
            tableContainer.appendChild(simpleDiv);
        });

        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: red;">
                <h3>Grid positioning failed - showing first 10 elements in simple layout</h3>
                <p>Elements data length: ${elementsData.length}</p>
                <button onclick="loadElements()" style="padding: 10px; margin-top: 10px;">Retry Loading Elements</button>
            </div>
        `;
        tableContainer.appendChild(errorDiv);
    }
}

// Get CSS class for element category
function getCategoryClass(category) {
    return category.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '');
}

// Show element details in modal
function showElementDetails(element) {
    const modal = document.getElementById('element-modal');
    const titleContainer = document.getElementById('element-title');
    const detailsContainer = document.getElementById('element-details');

    // Generate uses and applications based on element properties
    const uses = generateElementUses(element);
    const facts = generateInterestingFacts(element);
    const safety = generateSafetyInfo(element);

    // Set the modal title
    titleContainer.innerHTML = `<h2>${element.name} (${element.symbol})</h2>`;

    // Set the modal content
    detailsContainer.innerHTML = `
        <div class="element-info">
            <p><strong>Atomic Number:</strong> ${element.number}</p>
            <p><strong>Atomic Mass:</strong> ${element.atomic_mass}</p>
            <p><strong>Category:</strong> ${element.category}</p>
            <p><strong>Period:</strong> ${element.period}</p>
            <p><strong>Group:</strong> ${element.group}</p>
            <p><strong>Block:</strong> ${element.block}</p>
            <p><strong>Phase:</strong> ${element.phase}</p>
            ${element.density ? `<p><strong>Density:</strong> ${element.density} g/cm³</p>` : ''}
            ${element.melt ? `<p><strong>Melting Point:</strong> ${element.melt} K</p>` : ''}
            ${element.boil ? `<p><strong>Boiling Point:</strong> ${element.boil} K</p>` : ''}
            <p><strong>Summary:</strong> ${element.summary}</p>
        </div>

        <div class="uses-section">
            <h3>🏭 Uses & Applications</h3>
            <ul>
                ${uses.map(use => `<li>${use}</li>`).join('')}
            </ul>
        </div>

        <div class="facts-section">
            <h3>💡 Interesting Facts</h3>
            <ul>
                ${facts.map(fact => `<li>${fact}</li>`).join('')}
            </ul>
        </div>

        <div class="safety-section">
            <h3>⚠️ Safety Information</h3>
            <p>${safety}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// Generate uses and applications for an element
function generateElementUses(element) {
    const usesDatabase = {
        'H': ['Fuel for rockets and spacecraft', 'Production of ammonia for fertilizers', 'Hydrogenation of oils in food industry', 'Fuel cells for clean energy'],
        'He': ['Filling balloons and airships', 'Cooling agent in nuclear reactors', 'Breathing gas for deep-sea diving', 'Cryogenic applications'],
        'Li': ['Rechargeable batteries', 'Psychiatric medication', 'Ceramics and glass', 'Lubricating greases'],
        'Be': ['Aerospace applications', 'X-ray windows', 'Nuclear reactor components', 'Electronic heat sinks'],
        'B': ['Glass and ceramics', 'Detergents and bleaches', 'Fire retardants', 'Nuclear reactor control rods'],
        'C': ['Steel production', 'Pencil graphite', 'Diamond cutting tools', 'Carbon fiber composites'],
        'N': ['Fertilizer production', 'Food preservation', 'Liquid nitrogen cooling', 'Explosives manufacturing'],
        'O': ['Medical oxygen therapy', 'Steel production', 'Water treatment', 'Rocket fuel oxidizer'],
        'F': ['Toothpaste and dental care', 'Refrigerants', 'Teflon production', 'Uranium enrichment'],
        'Ne': ['Neon signs and lighting', 'Laser technology', 'Cryogenic refrigeration', 'High-voltage indicators'],
        'Na': ['Table salt production', 'Soap manufacturing', 'Street lighting', 'Chemical synthesis'],
        'Mg': ['Lightweight alloys', 'Fireworks and flares', 'Medical antacids', 'Automotive parts'],
        'Al': ['Aircraft construction', 'Food packaging', 'Construction materials', 'Electrical wiring'],
        'Si': ['Computer chips and electronics', 'Solar panels', 'Glass production', 'Silicone polymers'],
        'P': ['Fertilizers', 'Detergents', 'Matches and fireworks', 'Food additives'],
        'S': ['Sulfuric acid production', 'Rubber vulcanization', 'Gunpowder', 'Pharmaceutical drugs'],
        'Cl': ['Water disinfection', 'PVC plastic production', 'Bleaching agents', 'Swimming pool treatment'],
        'Ar': ['Welding shield gas', 'Light bulb filling', 'Wine preservation', 'Plasma displays'],
        'K': ['Fertilizers', 'Soap production', 'Glass manufacturing', 'Medical IV fluids'],
        'Ca': ['Cement and concrete', 'Bone and teeth health', 'Steel production', 'Paper manufacturing'],
        'Fe': ['Steel and iron production', 'Construction materials', 'Automotive industry', 'Medical supplements'],
        'Cu': ['Electrical wiring', 'Plumbing pipes', 'Coins and jewelry', 'Heat exchangers'],
        'Zn': ['Galvanizing steel', 'Brass production', 'Dietary supplements', 'Sunscreen'],
        'Ag': ['Photography', 'Jewelry and coins', 'Electrical contacts', 'Antimicrobial applications'],
        'Au': ['Jewelry and decorative items', 'Electronic components', 'Dental work', 'Investment commodity'],
        'Pt': ['Catalytic converters', 'Jewelry', 'Laboratory equipment', 'Cancer treatment drugs']
    };

    return usesDatabase[element.symbol] || [
        `Used in ${element.category} applications`,
        'Industrial processes',
        'Research and development',
        'Specialized chemical reactions'
    ];
}

// Generate interesting facts for an element
function generateInterestingFacts(element) {
    const factsDatabase = {
        'H': ['Most abundant element in the universe', 'Lightest element on the periodic table', 'Burns with an invisible flame', 'Can exist as three isotopes: protium, deuterium, and tritium'],
        'He': ['Second most abundant element in the universe', 'Only element discovered in space before Earth', 'Cannot be solidified at normal pressure', 'Makes your voice sound funny when inhaled'],
        'Li': ['Lightest metal', 'Can cut with a knife', 'Floats on water', 'Named after the Greek word for stone'],
        'C': ['Forms more compounds than any other element', 'Diamond is the hardest natural substance', 'Graphite conducts electricity', 'Essential for all known life'],
        'O': ['Most abundant element in Earth\'s crust', 'Discovered independently by three scientists', 'Paramagnetic (attracted to magnets)', 'Makes up about 21% of air'],
        'Fe': ['Most abundant element on Earth by mass', 'Core of the Earth is mostly iron', 'Essential for blood hemoglobin', 'Can be magnetized'],
        'Au': ['Does not tarnish or corrode', 'More malleable than any other metal', 'Conducts electricity very well', 'Symbol comes from Latin "aurum"'],
        'Pt': ['Rarer than gold', 'Does not tarnish', 'Used in the standard meter definition', 'Discovered in South America']
    };

    return factsDatabase[element.symbol] || [
        `${element.name} belongs to the ${element.category} group`,
        `Has an atomic mass of ${element.atomic_mass} u`,
        `Located in period ${element.period} of the periodic table`,
        `Exists in ${element.phase.toLowerCase()} phase at room temperature`
    ];
}

// Generate safety information for an element
function generateSafetyInfo(element) {
    const safetyDatabase = {
        'H': 'Highly flammable gas. Can form explosive mixtures with air. Store in well-ventilated areas away from ignition sources.',
        'He': 'Generally safe, but can cause asphyxiation in enclosed spaces. Non-toxic and non-flammable.',
        'Li': 'Highly reactive with water, producing flammable hydrogen gas. Can cause burns. Handle with dry hands and store under oil.',
        'Be': 'Highly toxic. Beryllium dust can cause lung disease. Requires special handling procedures and protective equipment.',
        'F': 'Extremely toxic and corrosive. Can cause severe burns. Handle only with proper protective equipment in well-ventilated areas.',
        'Cl': 'Toxic gas that can cause respiratory damage. Use in well-ventilated areas and avoid inhalation.',
        'Na': 'Highly reactive with water, producing heat and flammable hydrogen. Can cause burns. Store under oil.',
        'K': 'Even more reactive than sodium with water. Can ignite spontaneously in air. Handle with extreme caution.',
        'Fe': 'Generally safe in metallic form. Iron dust can be flammable. Rust can cause tetanus if it enters wounds.',
        'Cu': 'Generally safe to handle. Copper compounds can be toxic. Avoid ingestion and prolonged skin contact.',
        'Pb': 'Highly toxic heavy metal. Can cause neurological damage. Avoid inhalation of dust and wash hands after handling.',
        'Hg': 'Extremely toxic heavy metal. Mercury vapor is particularly dangerous. Requires special disposal procedures.',
        'U': 'Radioactive and chemically toxic. Requires special licensing and handling procedures. Can cause radiation sickness.',
        'Pu': 'Extremely radioactive and toxic. One of the most dangerous substances known. Requires maximum security handling.'
    };

    return safetyDatabase[element.symbol] ||
        `Handle with standard laboratory safety procedures. Wear appropriate protective equipment and ensure good ventilation. Consult safety data sheets for specific handling instructions.`;
}

// Close modal
function closeModal() {
    document.getElementById('element-modal').style.display = 'none';
}

// Load new quiz question
async function loadNewQuestion() {
    try {
        const response = await fetch('/api/quiz/random');
        currentQuiz = await response.json();
        displayQuestion();
    } catch (error) {
        console.error('Error loading quiz question:', error);
    }
}

// Display quiz question
function displayQuestion() {
    if (!currentQuiz) return;

    document.getElementById('question-text').textContent = currentQuiz.question;

    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';

    currentQuiz.answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.addEventListener('click', () => checkAnswer(answer));
        answersContainer.appendChild(button);
    });

    // Clear previous feedback
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('feedback').className = 'feedback';
}

// Check quiz answer
function checkAnswer(selectedAnswer) {
    const isCorrect = selectedAnswer === currentQuiz.correct_answer;
    questionCount++;

    if (isCorrect) {
        score++;
    }

    // Update score display
    document.getElementById('score').textContent = score;
    document.getElementById('question-count').textContent = questionCount;

    // Show feedback
    const feedback = document.getElementById('feedback');
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = `
        <p>${isCorrect ? '🎉 Correct!' : '❌ Incorrect'}</p>
        <p>The correct answer is: <strong>${currentQuiz.correct_answer}</strong></p>
        ${currentQuiz.explanation ? `<p>${currentQuiz.explanation}</p>` : ''}
    `;

    // Highlight answer buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentQuiz.correct_answer) {
            btn.classList.add('correct');
        } else if (btn.textContent === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
}

// Perform element search
async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No elements found matching your search.</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(element => `
        <div class="search-result">
            <h3>${element.name} (${element.symbol})</h3>
            <p><strong>Atomic Number:</strong> ${element.number}</p>
            <p><strong>Category:</strong> ${element.category}</p>
            <p><strong>Phase:</strong> ${element.phase}</p>
            <p>${element.summary.substring(0, 150)}...</p>
        </div>
    `).join('');
}

// Compound Mixer Functions

// Render mini periodic table for element selection
function renderMiniPeriodicTable() {
    console.log('Rendering mini periodic table...');
    const tableContainer = document.getElementById('mini-periodic-table');
    console.log('Mini table container found:', tableContainer);

    if (!tableContainer) {
        console.error('Mini periodic table container not found!');
        return;
    }

    if (!elementsData || elementsData.length === 0) {
        console.error('No elements data available for mini table!');
        tableContainer.innerHTML = '<p style="color: red; text-align: center; padding: 10px;">Error: No elements data loaded.</p>';
        return;
    }

    tableContainer.innerHTML = '';
    console.log('Rendering', elementsData.length, 'elements in mini table');

    elementsData.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.className = `mini-element ${getCategoryClass(element.category)}`;

        // Handle special positioning for lanthanides and actinides
        if (element.category === 'lanthanide') {
            // Lanthanum (57) should appear in the main grid at (6,3)
            if (element.number === 57) {
                elementDiv.style.gridColumn = element.group || 3;
                elementDiv.style.gridRow = element.period || 6;
            } else {
                // Other lanthanides go in row 8
                elementDiv.style.gridColumn = element.number - 54;
                elementDiv.style.gridRow = 8;
            }
        } else if (element.category === 'actinide') {
            // Actinium (89) should appear in the main grid at (7,3)
            if (element.number === 89) {
                elementDiv.style.gridColumn = element.group || 3;
                elementDiv.style.gridRow = element.period || 7;
            } else {
                // Other actinides go in row 9
                elementDiv.style.gridColumn = element.number - 86;
                elementDiv.style.gridRow = 9;
            }
        } else {
            elementDiv.style.gridColumn = element.group || 'auto';
            elementDiv.style.gridRow = element.period || 'auto';
        }

        elementDiv.innerHTML = `
            <div class="number">${element.number}</div>
            <div class="symbol">${element.symbol}</div>
        `;

        elementDiv.addEventListener('click', () => selectElement(element));
        tableContainer.appendChild(elementDiv);
    });
}

// Select an element for mixing
function selectElement(element) {
    // Always add element to selection (allow multiple instances)
    selectedElements.push(element);

    updateSelectedElementsDisplay();
    updateMiniTableSelection();
    updateMixButton();
}

// Update the display of selected elements
function updateSelectedElementsDisplay() {
    const container = document.getElementById('selected-elements');

    if (selectedElements.length === 0) {
        container.innerHTML = '<div class="drop-zone"><p>Click elements from the periodic table to add them here</p></div>';
        container.classList.remove('has-elements');
    } else {
        container.classList.add('has-elements');

        // Count elements
        const elementCounts = {};
        selectedElements.forEach(element => {
            const symbol = element.symbol;
            if (!elementCounts[symbol]) {
                elementCounts[symbol] = { element: element, count: 0 };
            }
            elementCounts[symbol].count++;
        });

        // Display elements with counts
        container.innerHTML = Object.values(elementCounts).map(({ element, count }) => `
            <div class="selected-element">
                <span>${element.symbol}${count > 1 ? `<sub>${count}</sub>` : ''} - ${element.name}</span>
                <div class="element-controls">
                    <button class="add-btn" onclick="addElement('${element.symbol}')" title="Add another ${element.symbol}">+</button>
                    <button class="remove-btn" onclick="removeElement('${element.symbol}')" title="Remove one ${element.symbol}">−</button>
                    <button class="remove-all-btn" onclick="removeAllElement('${element.symbol}')" title="Remove all ${element.symbol}">×</button>
                </div>
            </div>
        `).join('');
    }
}

// Add another instance of an element
function addElement(symbol) {
    const element = elementsData.find(el => el.symbol === symbol);
    if (element) {
        selectedElements.push(element);
        updateSelectedElementsDisplay();
        updateMiniTableSelection();
        updateMixButton();
    }
}

// Remove one instance of an element from selection
function removeElement(symbol) {
    const index = selectedElements.findIndex(el => el.symbol === symbol);
    if (index !== -1) {
        selectedElements.splice(index, 1);
        updateSelectedElementsDisplay();
        updateMiniTableSelection();
        updateMixButton();
    }
}

// Remove all instances of an element from selection
function removeAllElement(symbol) {
    selectedElements = selectedElements.filter(el => el.symbol !== symbol);
    updateSelectedElementsDisplay();
    updateMiniTableSelection();
    updateMixButton();
}

// Update mini table visual selection
function updateMiniTableSelection() {
    const miniElements = document.querySelectorAll('.mini-element');

    // Count selected elements
    const elementCounts = {};
    selectedElements.forEach(element => {
        const symbol = element.symbol;
        elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
    });

    miniElements.forEach(el => {
        const symbol = el.querySelector('.symbol').textContent;
        const count = elementCounts[symbol] || 0;
        const isSelected = count > 0;

        el.classList.toggle('selected', isSelected);

        // Add count indicator
        let countIndicator = el.querySelector('.count-indicator');
        if (count > 1) {
            if (!countIndicator) {
                countIndicator = document.createElement('div');
                countIndicator.className = 'count-indicator';
                el.appendChild(countIndicator);
            }
            countIndicator.textContent = count;
        } else if (countIndicator) {
            countIndicator.remove();
        }
    });
}

// Update mix button state
function updateMixButton() {
    const mixBtn = document.getElementById('mix-elements-btn');
    mixBtn.disabled = selectedElements.length < 1;

    // Update button text based on selection
    const elementCounts = {};
    selectedElements.forEach(element => {
        elementCounts[element.symbol] = (elementCounts[element.symbol] || 0) + 1;
    });

    const uniqueElements = Object.keys(elementCounts).length;
    if (selectedElements.length === 0) {
        mixBtn.textContent = '🔥 Mix Elements';
    } else if (uniqueElements === 1) {
        mixBtn.textContent = `🔥 Analyze ${Object.keys(elementCounts)[0]}`;
    } else {
        mixBtn.textContent = `🔥 Mix ${uniqueElements} Elements`;
    }
}

// Clear all selected elements
function clearSelection() {
    selectedElements = [];
    updateSelectedElementsDisplay();
    updateMiniTableSelection();
    updateMixButton();
    hideCompoundResult();
    hideReactionAnimation();
}

// Mix selected elements
async function mixElements() {
    if (selectedElements.length < 1) {
        alert('Please select at least 1 element to analyze or mix!');
        return;
    }

    try {
        showReactionAnimation();

        const response = await fetch('/api/mix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                elements: selectedElements
            })
        });

        const result = await response.json();

        setTimeout(() => {
            hideReactionAnimation();
            if (result.success) {
                displayCompoundResult(result.compound, true, result);
                playSuccessSound();
            } else {
                displayCompoundResult(result.suggestion, false, result);
                playErrorSound();
            }
        }, 3000); // Show animation for 3 seconds

    } catch (error) {
        console.error('Error mixing elements:', error);
        hideReactionAnimation();
        alert('Error occurred while mixing elements. Please try again.');
    }
}

// Show random compound
async function showRandomCompound() {
    try {
        const response = await fetch('/api/random-compound');
        const result = await response.json();

        // Set the selected elements to match the compound
        selectedElements = result.elements;
        updateSelectedElementsDisplay();
        updateMiniTableSelection();
        updateMixButton();

        // Show the compound result
        displayCompoundResult(result.compound);

    } catch (error) {
        console.error('Error loading random compound:', error);
    }
}

// Display compound result
function displayCompoundResult(compound, isSuccess = true, apiResult = null) {
    const resultContainer = document.getElementById('compound-result');

    if (!compound) {
        resultContainer.style.display = 'none';
        return;
    }

    // Determine status based on match type
    let statusClass = 'hypothetical';
    let statusMessage = '🔬 Hypothetical Compound';

    if (isSuccess && apiResult) {
        const matchType = apiResult.match_type;
        if (matchType === 'exact') {
            statusClass = 'exact';
            statusMessage = '✅ Perfect Stoichiometric Match';
        } else if (matchType === 'ratio') {
            statusClass = 'ratio';
            statusMessage = '⚗️ Compound Formed (Educational)';
        } else {
            statusClass = 'success';
            statusMessage = '✅ Known Compound';
        }
    }

    resultContainer.innerHTML = `
        <div class="compound-header">
            <div class="compound-formula">${compound.formula}</div>
            <div class="compound-name">${compound.name}</div>
            <div class="compound-status ${statusClass}">${statusMessage}</div>
            ${apiResult && apiResult.note ? `<div class="educational-note">📚 ${apiResult.note}</div>` : ''}
            ${apiResult && apiResult.educational_note ? `<div class="educational-tip">💡 ${apiResult.educational_note}</div>` : ''}
        </div>

        <div class="compound-details">
            <div class="detail-section">
                <h4>🔬 Physical Properties</h4>
                <div class="property-grid">
                    <div class="property-item">
                        <span class="property-label">Molecular Mass:</span>
                        <span class="property-value">${compound.molecular_mass} g/mol</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">State:</span>
                        <span class="property-value">${compound.state || 'Unknown'}</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">Color:</span>
                        <span class="property-value">${compound.color || 'Unknown'}</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">Density:</span>
                        <span class="property-value">${compound.density ? compound.density + ' g/cm³' : 'Unknown'}</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">Melting Point:</span>
                        <span class="property-value">${compound.melting_point ? compound.melting_point + '°C' : 'Unknown'}</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">Boiling Point:</span>
                        <span class="property-value">${compound.boiling_point ? compound.boiling_point + '°C' : 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>⚗️ Chemical Properties</h4>
                <div class="property-grid">
                    <div class="property-item">
                        <span class="property-label">Bond Type:</span>
                        <span class="property-value">${compound.bond_type || 'Unknown'}</span>
                    </div>
                    <div class="property-item">
                        <span class="property-label">Solubility:</span>
                        <span class="property-value">${compound.solubility || 'Unknown'}</span>
                    </div>
                </div>
                <p><strong>Reactivity:</strong> ${compound.reactivity || 'Unknown'}</p>
                ${compound.formation_reaction ? `<p><strong>Formation:</strong> ${compound.formation_reaction}</p>` : ''}
            </div>

            <div class="detail-section">
                <h4>🏭 Uses & Applications</h4>
                <ul class="uses-list">
                    ${(compound.uses || ['No known uses']).map(use => `<li>${use}</li>`).join('')}
                </ul>
            </div>

            <div class="detail-section">
                <h4>💡 Interesting Facts</h4>
                <ul class="facts-list">
                    ${(compound.interesting_facts || [compound.note || 'No additional information available']).map(fact => `<li>${fact}</li>`).join('')}
                </ul>
            </div>

            <div class="detail-section">
                <h4>⚠️ Safety Information</h4>
                <p>${compound.safety || 'Safety information not available'}</p>
            </div>
        </div>
    `;

    resultContainer.classList.add('show');
    resultContainer.style.display = 'block';

    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Hide compound result
function hideCompoundResult() {
    const resultContainer = document.getElementById('compound-result');
    resultContainer.classList.remove('show');
    resultContainer.style.display = 'none';
}

// Show reaction animation
function showReactionAnimation() {
    const animationContainer = document.getElementById('reaction-animation');

    const elementSymbols = selectedElements.map(el => el.symbol);
    const reactionSteps = elementSymbols.join(' + ');

    animationContainer.innerHTML = `
        <h3>🧪 Chemical Reaction in Progress...</h3>
        <div class="reaction-steps">
            ${elementSymbols.map(symbol => `<div class="reaction-element">${symbol}</div>`).join('<div class="reaction-plus">+</div>')}
            <div class="reaction-arrow">→</div>
            <div class="reaction-product">?</div>
        </div>
        <p>Mixing elements to create new compound...</p>
    `;

    animationContainer.classList.add('show');
    animationContainer.style.display = 'block';
}

// Hide reaction animation
function hideReactionAnimation() {
    const animationContainer = document.getElementById('reaction-animation');
    animationContainer.classList.remove('show');
    animationContainer.style.display = 'none';
}

// Audio feedback functions
function playSuccessSound() {
    // Create a simple success sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio not supported');
    }
}

function playErrorSound() {
    // Create a simple error sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio not supported');
    }
}
