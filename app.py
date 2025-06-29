from flask import Flask, render_template, jsonify, request
import json
import random
import os

app = Flask(__name__)

# Load elements data
def load_elements():
    with open('data/elements.json', 'r') as f:
        return json.load(f)

# Load compounds data
def load_compounds():
    with open('data/compounds.json', 'r', encoding='utf-8') as f:
        return json.load(f)

elements_data = load_elements()
compounds_data = load_compounds()

@app.route('/')
def index():
    """Main page with periodic table and quiz"""
    return render_template('index.html')

@app.route('/api/elements')
def get_elements():
    """API endpoint to get all elements data"""
    return jsonify(elements_data)

@app.route('/api/element/<int:atomic_number>')
def get_element(atomic_number):
    """API endpoint to get specific element by atomic number"""
    for element in elements_data['elements']:
        if element['number'] == atomic_number:
            return jsonify(element)
    return jsonify({'error': 'Element not found'}), 404

@app.route('/api/quiz/random')
def get_random_quiz():
    """Generate a random quiz question"""
    element = random.choice(elements_data['elements'])

    # Different types of questions
    question_types = [
        'symbol_to_name',
        'name_to_symbol',
        'atomic_number_to_name',
        'category_question',
        'property_question'
    ]

    question_type = random.choice(question_types)

    if question_type == 'symbol_to_name':
        question = f"What is the name of the element with symbol '{element['symbol']}'?"
        correct_answer = element['name']
        # Generate wrong answers
        wrong_answers = [e['name'] for e in random.sample(elements_data['elements'], 3) if e['name'] != correct_answer]

    elif question_type == 'name_to_symbol':
        question = f"What is the chemical symbol for {element['name']}?"
        correct_answer = element['symbol']
        wrong_answers = [e['symbol'] for e in random.sample(elements_data['elements'], 3) if e['symbol'] != correct_answer]

    elif question_type == 'atomic_number_to_name':
        question = f"Which element has atomic number {element['number']}?"
        correct_answer = element['name']
        wrong_answers = [e['name'] for e in random.sample(elements_data['elements'], 3) if e['name'] != correct_answer]

    elif question_type == 'category_question':
        question = f"What category does {element['name']} belong to?"
        correct_answer = element['category']
        # Get other categories
        all_categories = list(set([e['category'] for e in elements_data['elements']]))
        wrong_answers = [cat for cat in random.sample(all_categories, min(3, len(all_categories)-1)) if cat != correct_answer]

    elif question_type == 'property_question':
        if element['phase']:
            question = f"What is the phase of {element['name']} at room temperature?"
            correct_answer = element['phase']
            phases = ['Solid', 'Liquid', 'Gas']
            wrong_answers = [phase for phase in phases if phase != correct_answer]
        else:
            # Fallback to symbol question
            question = f"What is the chemical symbol for {element['name']}?"
            correct_answer = element['symbol']
            wrong_answers = [e['symbol'] for e in random.sample(elements_data['elements'], 3) if e['symbol'] != correct_answer]

    # Ensure we have exactly 3 wrong answers
    while len(wrong_answers) < 3:
        random_element = random.choice(elements_data['elements'])
        if question_type == 'symbol_to_name' or question_type == 'atomic_number_to_name':
            candidate = random_element['name']
        elif question_type == 'name_to_symbol':
            candidate = random_element['symbol']
        elif question_type == 'category_question':
            candidate = random_element['category']
        else:
            candidate = random_element['phase'] if random_element['phase'] else 'Unknown'

        if candidate != correct_answer and candidate not in wrong_answers:
            wrong_answers.append(candidate)

    # Shuffle answers
    all_answers = [correct_answer] + wrong_answers[:3]
    random.shuffle(all_answers)

    return jsonify({
        'question': question,
        'answers': all_answers,
        'correct_answer': correct_answer,
        'element': element,
        'explanation': f"{element['name']} ({element['symbol']}) is {element['summary'][:100]}..."
    })

@app.route('/api/quiz/check', methods=['POST'])
def check_answer():
    """Check if the submitted answer is correct"""
    data = request.get_json()
    user_answer = data.get('answer')
    correct_answer = data.get('correct_answer')

    is_correct = user_answer == correct_answer

    return jsonify({
        'correct': is_correct,
        'message': 'Correct!' if is_correct else f'Incorrect. The correct answer is: {correct_answer}'
    })

@app.route('/api/search')
def search_elements():
    """Search elements by name or symbol"""
    query = request.args.get('q', '').lower()

    if not query:
        return jsonify([])

    results = []
    for element in elements_data['elements']:
        if (element['name'].lower().startswith(query) or
            element['symbol'].lower().startswith(query) or
            str(element['number']) == query):
            results.append(element)

    return jsonify(results[:10])  # Limit to 10 results

@app.route('/api/compounds')
def get_compounds():
    """API endpoint to get all compounds data"""
    return jsonify(compounds_data)

@app.route('/api/mix', methods=['POST'])
def mix_elements():
    """Mix elements to create compounds - now supports ANY combination!"""
    data = request.get_json()
    selected_elements = data.get('elements', [])

    if len(selected_elements) < 1:
        return jsonify({'error': 'At least 1 element is required'}), 400

    # Count selected elements
    selected_counts = {}
    element_symbols = []
    for elem in selected_elements:
        symbol = elem['symbol']
        selected_counts[symbol] = selected_counts.get(symbol, 0) + 1
        element_symbols.append(symbol)

    # Try to find exact match in predefined compounds first
    exact_match = find_exact_compound_match(selected_counts)
    if exact_match:
        return jsonify({
            'success': True,
            'compound': exact_match,
            'message': f'Successfully created {exact_match["name"]}!',
            'match_type': 'exact'
        })

    # Try to find compounds with same elements but different ratios
    ratio_match = find_ratio_compound_match(selected_counts)
    if ratio_match:
        compound, suggested_ratio = ratio_match
        return jsonify({
            'success': True,
            'compound': compound,
            'message': f'Created {compound["name"]} using available elements!',
            'match_type': 'ratio',
            'note': f'Ideal ratio would be {suggested_ratio}, but compound formed with available elements.'
        })

    # Generate compound dynamically from ANY combination of elements
    dynamic_compound = generate_compound_dynamically(element_symbols)

    return jsonify({
        'success': True,
        'compound': dynamic_compound,
        'message': f'Successfully created {dynamic_compound["name"]}!',
        'match_type': 'dynamic',
        'note': 'This compound was generated dynamically based on chemical principles!'
    })

@app.route('/api/random-compound')
def get_random_compound():
    """Get a random compound for demonstration"""
    try:
        compound = random.choice(compounds_data['compounds'])

        # Get the elements for this compound
        compound_elements = []
        if 'elements' in compound:
            for symbol in compound['elements']:
                for element in elements_data['elements']:
                    if element['symbol'] == symbol:
                        compound_elements.append(element)
                        break

        # Ensure compound has required fields
        if 'formula' not in compound:
            compound['formula'] = ''.join(compound.get('elements', ['Unknown']))
        if 'name' not in compound:
            compound['name'] = f"Compound of {', '.join(compound.get('elements', ['Unknown']))}"

        return jsonify({
            'formula': compound.get('formula', 'Unknown'),
            'name': compound.get('name', 'Unknown Compound'),
            'elements': compound.get('elements', []),
            'molecular_mass': compound.get('molecular_mass', 0),
            'category': compound.get('category', 'Unknown'),
            'state': compound.get('state', 'Unknown'),
            'uses': compound.get('uses', ['Unknown applications'])
        })
    except Exception as e:
        # Fallback compound
        return jsonify({
            'formula': 'H2O',
            'name': 'Water',
            'elements': ['H', 'O'],
            'molecular_mass': 18.015,
            'category': 'Oxide',
            'state': 'Liquid',
            'uses': ['Essential for life', 'Universal solvent']
        })

def get_oxidation_states():
    """Get common oxidation states for elements"""
    return {
        # Group 1 - Alkali metals
        'H': [1, -1], 'Li': [1], 'Na': [1], 'K': [1], 'Rb': [1], 'Cs': [1], 'Fr': [1],

        # Group 2 - Alkaline earth metals
        'Be': [2], 'Mg': [2], 'Ca': [2], 'Sr': [2], 'Ba': [2], 'Ra': [2],

        # Group 13
        'B': [3], 'Al': [3], 'Ga': [3], 'In': [3], 'Tl': [1, 3],

        # Group 14
        'C': [4, -4], 'Si': [4], 'Ge': [2, 4], 'Sn': [2, 4], 'Pb': [2, 4],

        # Group 15
        'N': [3, 5, -3], 'P': [3, 5, -3], 'As': [3, 5, -3], 'Sb': [3, 5], 'Bi': [3, 5],

        # Group 16
        'O': [-2], 'S': [2, 4, 6, -2], 'Se': [2, 4, 6, -2], 'Te': [2, 4, 6], 'Po': [2, 4],

        # Group 17 - Halogens
        'F': [-1], 'Cl': [1, 3, 5, 7, -1], 'Br': [1, 3, 5, 7, -1], 'I': [1, 3, 5, 7, -1], 'At': [1, 3, 5, 7, -1],

        # Group 18 - Noble gases
        'He': [0], 'Ne': [0], 'Ar': [0], 'Kr': [2], 'Xe': [2, 4, 6], 'Rn': [2], 'Og': [0],

        # Transition metals (common oxidation states)
        'Sc': [3], 'Ti': [2, 3, 4], 'V': [2, 3, 4, 5], 'Cr': [2, 3, 6], 'Mn': [2, 3, 4, 6, 7],
        'Fe': [2, 3], 'Co': [2, 3], 'Ni': [2, 3], 'Cu': [1, 2], 'Zn': [2],
        'Y': [3], 'Zr': [4], 'Nb': [3, 5], 'Mo': [2, 3, 4, 5, 6], 'Tc': [4, 7], 'Ru': [2, 3, 4, 8],
        'Rh': [3], 'Pd': [2, 4], 'Ag': [1], 'Cd': [2],
        'Hf': [4], 'Ta': [5], 'W': [2, 3, 4, 5, 6], 'Re': [4, 6, 7], 'Os': [2, 3, 4, 6, 8],
        'Ir': [3, 4], 'Pt': [2, 4], 'Au': [1, 3], 'Hg': [1, 2],

        # Lanthanides (mostly +3)
        'La': [3], 'Ce': [3, 4], 'Pr': [3], 'Nd': [3], 'Pm': [3], 'Sm': [2, 3], 'Eu': [2, 3],
        'Gd': [3], 'Tb': [3, 4], 'Dy': [3], 'Ho': [3], 'Er': [3], 'Tm': [3], 'Yb': [2, 3], 'Lu': [3],

        # Actinides
        'Ac': [3], 'Th': [4], 'Pa': [4, 5], 'U': [3, 4, 5, 6], 'Np': [3, 4, 5, 6, 7], 'Pu': [3, 4, 5, 6],
        'Am': [3, 4, 5, 6], 'Cm': [3], 'Bk': [3, 4], 'Cf': [3], 'Es': [3], 'Fm': [3], 'Md': [3], 'No': [2, 3], 'Lr': [3],

        # Super-heavy elements (predicted)
        'Rf': [4], 'Db': [5], 'Sg': [6], 'Bh': [7], 'Hs': [8], 'Mt': [9], 'Ds': [10], 'Rg': [11], 'Cn': [12],
        'Nh': [13], 'Fl': [14], 'Mc': [15], 'Lv': [16], 'Ts': [17]
    }

def generate_compound_dynamically(element_symbols):
    """Generate a compound dynamically from any combination of elements"""
    from math import gcd
    from functools import reduce

    # Count elements
    element_counts = {}
    for symbol in element_symbols:
        element_counts[symbol] = element_counts.get(symbol, 0) + 1

    unique_elements = list(element_counts.keys())

    # Get element data
    element_data = {}
    for symbol in unique_elements:
        for element in elements_data['elements']:
            if element['symbol'] == symbol:
                element_data[symbol] = element
                break

    # Handle single element (diatomic or monatomic)
    if len(unique_elements) == 1:
        symbol = unique_elements[0]
        count = element_counts[symbol]
        element = element_data[symbol]

        if count == 1:
            # Monatomic (noble gases or metals)
            formula = symbol
            name = element['name']
            compound_type = "Element"
        else:
            # Diatomic or polyatomic
            formula = f"{symbol}{count}" if count > 1 else symbol
            if symbol in ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']:
                name = f"{element['name']} Gas"
                compound_type = "Diatomic Gas"
            else:
                name = f"{element['name']} Cluster"
                compound_type = "Polyatomic"

        return create_compound_object(formula, name, unique_elements, element_counts, element_data, compound_type)

    # Handle binary compounds (2 elements)
    elif len(unique_elements) == 2:
        return generate_binary_compound(unique_elements, element_counts, element_data)

    # Handle ternary and higher compounds (3+ elements)
    else:
        return generate_complex_compound(unique_elements, element_counts, element_data)

def generate_binary_compound(elements, element_counts, element_data):
    """Generate binary compound with proper stoichiometry"""
    from math import gcd

    elem1, elem2 = elements
    count1, count2 = element_counts[elem1], element_counts[elem2]

    # Determine which is more metallic
    categories1 = element_data[elem1]['category']
    categories2 = element_data[elem2]['category']

    metal_categories = ['alkali metal', 'alkaline earth metal', 'transition metal', 'post-transition metal', 'lanthanide', 'actinide']
    nonmetal_categories = ['diatomic nonmetal', 'polyatomic nonmetal', 'noble gas']

    if categories1 in metal_categories and categories2 in nonmetal_categories:
        metal, nonmetal = elem1, elem2
        metal_count, nonmetal_count = count1, count2
    elif categories2 in metal_categories and categories1 in nonmetal_categories:
        metal, nonmetal = elem2, elem1
        metal_count, nonmetal_count = count2, count1
    else:
        # Both metals or both nonmetals - use alphabetical order
        if elem1 < elem2:
            metal, nonmetal = elem1, elem2
            metal_count, nonmetal_count = count1, count2
        else:
            metal, nonmetal = elem2, elem1
            metal_count, nonmetal_count = count2, count1

    # Create formula
    if metal_count == 1 and nonmetal_count == 1:
        formula = f"{metal}{nonmetal}"
    elif metal_count == 1:
        formula = f"{metal}{nonmetal}{nonmetal_count}"
    elif nonmetal_count == 1:
        formula = f"{metal}{metal_count}{nonmetal}"
    else:
        formula = f"{metal}{metal_count}{nonmetal}{nonmetal_count}"

    # Create name
    name = create_binary_compound_name(element_data[metal], element_data[nonmetal], metal_count, nonmetal_count)

    # Determine compound type
    if nonmetal == 'O':
        compound_type = "Oxide"
    elif nonmetal in ['F', 'Cl', 'Br', 'I', 'At']:
        compound_type = "Halide"
    elif nonmetal == 'S':
        compound_type = "Sulfide"
    elif nonmetal == 'N':
        compound_type = "Nitride"
    elif nonmetal == 'C':
        compound_type = "Carbide"
    elif nonmetal == 'H':
        compound_type = "Hydride"
    elif nonmetal == 'P':
        compound_type = "Phosphide"
    else:
        compound_type = "Binary Compound"

    return create_compound_object(formula, name, elements, element_counts, element_data, compound_type)

def generate_complex_compound(elements, element_counts, element_data):
    """Generate complex compound with 3+ elements"""

    # Sort elements by count (descending) then alphabetically
    sorted_elements = sorted(elements, key=lambda x: (-element_counts[x], x))

    # Create formula
    formula_parts = []
    for elem in sorted_elements:
        count = element_counts[elem]
        if count == 1:
            formula_parts.append(elem)
        else:
            formula_parts.append(f"{elem}{count}")

    formula = "".join(formula_parts)

    # Create name
    element_names = [element_data[elem]['name'] for elem in sorted_elements]
    name = " ".join(element_names) + " Compound"

    # Determine compound type
    if 'O' in elements:
        if len(elements) == 3:
            compound_type = "Ternary Oxide"
        else:
            compound_type = "Complex Oxide"
    elif any(elem in ['F', 'Cl', 'Br', 'I', 'At'] for elem in elements):
        compound_type = "Complex Halide"
    else:
        compound_type = "Complex Compound"

    return create_compound_object(formula, name, elements, element_counts, element_data, compound_type)

def create_binary_compound_name(metal_elem, nonmetal_elem, metal_count, nonmetal_count):
    """Create systematic name for binary compound"""

    # Special naming for common compounds
    if nonmetal_elem['symbol'] == 'O':
        if metal_count == 1 and nonmetal_count == 1:
            return f"{metal_elem['name']} Oxide"
        elif metal_count == 2 and nonmetal_count == 1:
            return f"{metal_elem['name']} Oxide"
        elif metal_count == 1 and nonmetal_count == 2:
            return f"{metal_elem['name']} Dioxide"
        elif metal_count == 2 and nonmetal_count == 3:
            return f"{metal_elem['name']} Trioxide"
        else:
            return f"{metal_elem['name']} Oxide"

    elif nonmetal_elem['symbol'] in ['F', 'Cl', 'Br', 'I', 'At']:
        halogen_names = {'F': 'Fluoride', 'Cl': 'Chloride', 'Br': 'Bromide', 'I': 'Iodide', 'At': 'Astatide'}
        base_name = halogen_names[nonmetal_elem['symbol']]

        if nonmetal_count == 1:
            return f"{metal_elem['name']} {base_name}"
        elif nonmetal_count == 2:
            return f"{metal_elem['name']} Di{base_name.lower()}"
        elif nonmetal_count == 3:
            return f"{metal_elem['name']} Tri{base_name.lower()}"
        elif nonmetal_count == 4:
            return f"{metal_elem['name']} Tetra{base_name.lower()}"
        else:
            return f"{metal_elem['name']} {base_name}"

    elif nonmetal_elem['symbol'] == 'S':
        return f"{metal_elem['name']} Sulfide"
    elif nonmetal_elem['symbol'] == 'N':
        return f"{metal_elem['name']} Nitride"
    elif nonmetal_elem['symbol'] == 'C':
        return f"{metal_elem['name']} Carbide"
    elif nonmetal_elem['symbol'] == 'H':
        return f"{metal_elem['name']} Hydride"
    elif nonmetal_elem['symbol'] == 'P':
        return f"{metal_elem['name']} Phosphide"
    else:
        return f"{metal_elem['name']} {nonmetal_elem['name']}"

def create_compound_object(formula, name, elements, element_counts, element_data, compound_type):
    """Create a complete compound object"""

    # Calculate molecular mass
    molecular_mass = sum(element_data[elem]['atomic_mass'] * count for elem, count in element_counts.items())

    # Determine bond type
    metal_categories = ['alkali metal', 'alkaline earth metal', 'transition metal', 'post-transition metal', 'lanthanide', 'actinide']
    nonmetal_categories = ['diatomic nonmetal', 'polyatomic nonmetal']

    has_metal = any(element_data[elem]['category'] in metal_categories for elem in elements)
    has_nonmetal = any(element_data[elem]['category'] in nonmetal_categories for elem in elements)

    if has_metal and has_nonmetal:
        bond_type = "Ionic"
    elif len(elements) == 1:
        bond_type = "Metallic" if has_metal else "Covalent"
    else:
        bond_type = "Covalent"

    # Determine state
    if compound_type in ["Diatomic Gas", "Noble Gas"]:
        state = "Gas"
    elif any(elem in ['H', 'N', 'O', 'F', 'Cl'] for elem in elements) and len(elements) <= 2:
        state = "Gas"
    else:
        state = "Solid"

    # Create uses based on compound type and elements
    uses = generate_compound_uses(elements, compound_type, element_data)

    # Create interesting facts
    facts = generate_interesting_facts(elements, compound_type, element_data)

    return {
        'formula': formula,
        'name': name,
        'elements': elements,
        'element_counts': element_counts,
        'molecular_mass': round(molecular_mass, 2),
        'state': state,
        'melting_point': None,
        'boiling_point': None,
        'density': None,
        'color': 'Unknown',
        'solubility': 'Varies',
        'reactivity': 'Varies with conditions',
        'uses': uses,
        'formation_reaction': f"{' + '.join(elements)} → {formula}",
        'bond_type': bond_type,
        'interesting_facts': facts,
        'safety': 'Handle with appropriate safety measures',
        'discovery': 'Synthetic or naturally occurring',
        'category': compound_type
    }

def generate_compound_uses(elements, compound_type, element_data):
    """Generate realistic uses based on elements and compound type"""
    uses = []

    # Based on compound type
    if compound_type == "Oxide":
        uses.extend(['Refractory materials', 'Ceramic applications', 'Pigments'])
    elif compound_type == "Halide":
        uses.extend(['Chemical synthesis', 'Disinfectant', 'Photography'])
    elif compound_type == "Hydride":
        uses.extend(['Hydrogen storage', 'Reducing agent', 'Battery materials'])
    elif compound_type == "Carbide":
        uses.extend(['Cutting tools', 'Abrasives', 'High-temperature applications'])
    elif compound_type == "Nitride":
        uses.extend(['Hard coatings', 'Semiconductors', 'Cutting tools'])

    # Based on elements present
    if 'O' in elements:
        uses.extend(['Oxidizing agent', 'Ceramic applications', 'Refractory materials'])
    if any(elem in ['F', 'Cl', 'Br', 'I'] for elem in elements):
        uses.extend(['Chemical synthesis', 'Disinfectant', 'Pharmaceutical intermediate'])
    if 'H' in elements:
        uses.extend(['Reducing agent', 'Hydrogen storage', 'Chemical processing'])
    if 'C' in elements:
        uses.extend(['High-temperature applications', 'Cutting tools', 'Abrasives'])
    if 'N' in elements:
        uses.extend(['Hard coatings', 'Cutting tools', 'Electronic applications'])

    # Based on element categories
    categories = [element_data[elem]['category'] for elem in elements]
    if 'transition metal' in categories:
        uses.extend(['Catalysis', 'Magnetic materials', 'Electronic components'])
    if 'lanthanide' in categories:
        uses.extend(['Phosphors', 'Laser materials', 'Magnetic applications'])
    if 'actinide' in categories:
        uses.extend(['Nuclear applications', 'Research purposes', 'Specialized materials'])

    # Default uses
    if not uses:
        uses = ['Research applications', 'Chemical synthesis', 'Industrial processes']

    return list(set(uses))  # Remove duplicates

def generate_interesting_facts(elements, compound_type, element_data):
    """Generate interesting facts based on elements and compound type"""
    facts = []

    # Based on compound type
    if compound_type == "Oxide":
        facts.append("Metal oxide with potential ceramic applications")
    elif compound_type == "Halide":
        facts.append("Halide compound with ionic bonding")
    elif compound_type == "Diatomic Gas":
        facts.append("Diatomic molecule found in gaseous state")

    # Based on elements
    if any(element_data[elem]['category'] == 'lanthanide' for elem in elements):
        facts.append("Contains rare earth elements")
    if any(element_data[elem]['category'] == 'actinide' for elem in elements):
        facts.append("Contains radioactive actinide elements")
    if any(element_data[elem]['number'] > 103 for elem in elements):
        facts.append("Contains super-heavy synthetic elements")

    # Based on element properties
    if len(elements) > 3:
        facts.append("Complex multi-element compound")
    if any(element_data[elem]['atomic_mass'] > 200 for elem in elements):
        facts.append("Contains heavy elements")

    # Default fact
    if not facts:
        facts.append(f"Compound containing {', '.join(elements)}")

    return facts

def find_exact_compound_match(selected_counts):
    """Find a compound that exactly matches the selected element counts"""
    for compound in compounds_data['compounds']:
        if compound['element_counts'] == selected_counts:
            return compound
    return None

def find_ratio_compound_match(selected_counts):
    """Find a compound with same elements but allow different ratios"""
    selected_elements = set(selected_counts.keys())

    for compound in compounds_data['compounds']:
        compound_elements = set(compound['elements'])

        # Check if we have the same elements
        if compound_elements == selected_elements:
            # Create a readable ratio string
            ratio_parts = []
            for element in sorted(compound['elements']):
                count = compound['element_counts'][element]
                if count == 1:
                    ratio_parts.append(element)
                else:
                    ratio_parts.append(f"{count}{element}")

            suggested_ratio = " + ".join(ratio_parts)
            return compound, suggested_ratio

    return None

def generate_hypothetical_compound(elements):
    """Generate a hypothetical compound when no known compound exists"""
    if len(elements) == 2:
        elem1, elem2 = elements

        # Simple binary compound naming
        if elem1['category'] in ['alkali metal', 'alkaline earth metal'] and elem2['category'] in ['diatomic nonmetal', 'polyatomic nonmetal']:
            # Ionic compound
            formula = f"{elem1['symbol']}{elem2['symbol']}"
            name = f"{elem1['name']} {elem2['name'].lower()}ide"
            bond_type = "Ionic"
        else:
            # Covalent compound
            formula = f"{elem1['symbol']}{elem2['symbol']}"
            name = f"{elem1['name']} {elem2['name'].lower()}"
            bond_type = "Covalent"

        return {
            'formula': formula,
            'name': name,
            'elements': [elem1['symbol'], elem2['symbol']],
            'molecular_mass': elem1['atomic_mass'] + elem2['atomic_mass'],
            'bond_type': bond_type,
            'state': 'Unknown',
            'note': 'This is a hypothetical compound. Properties are estimated.',
            'uses': ['Theoretical compound for educational purposes'],
            'safety': 'Properties unknown - handle with caution'
        }

    # For more than 2 elements, create a generic compound
    symbols = [elem['symbol'] for elem in elements]
    total_mass = sum(elem['atomic_mass'] for elem in elements)

    return {
        'formula': ''.join(symbols),
        'name': f"Mixed compound of {', '.join([elem['name'] for elem in elements])}",
        'elements': symbols,
        'molecular_mass': total_mass,
        'bond_type': 'Mixed',
        'state': 'Unknown',
        'note': 'This is a hypothetical multi-element compound.',
        'uses': ['Theoretical compound for educational purposes'],
        'safety': 'Properties unknown - handle with caution'
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
