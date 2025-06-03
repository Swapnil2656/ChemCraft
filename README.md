# 🧪 ChemCraft: A Gamified Periodic Table Experience

**Where Chemistry meets Creativity — Play, Learn, and Master the Elements!**

ChemCraft is an interactive, browser-based educational game designed to make learning the Periodic Table of Elements fun, engaging, and accessible. Built with Flask (Python) for the backend and HTML/CSS/JavaScript for the frontend, the game combines elements of quizzing, interactive exploration, and data visualization.

## 🎯 Features

### 🔬 Interactive Periodic Table
- **Color-coded elements** by category (metals, nonmetals, noble gases, etc.)
- **Click any element** to view detailed information
- **Responsive design** that works on desktop and mobile
- **Hover effects** and smooth animations

### 🎮 Quiz Mode
- **Multiple choice questions** about elements
- **Different question types**: symbol-to-name, atomic number, categories, properties
- **Real-time scoring** and progress tracking
- **Instant feedback** with explanations

### ⚗️ Element Mixing & Compound Creation
- **Interactive element selection** from mini periodic table
- **Real-time compound formation** with 8 common compounds
- **Detailed compound specifications** (molecular mass, properties, uses)
- **Visual reaction animations** with element combination effects
- **Audio feedback** for successful/failed reactions
- **Educational insights** about real-world applications
- **Safety information** and interesting facts
- **Hypothetical compound generation** for unknown combinations

### 🔍 Element Search
- **Search by name, symbol, or atomic number**
- **Quick results** with key element information
- **Easy-to-browse** search results

### 🎨 Modern UI/UX
- **Beautiful gradient backgrounds**
- **Glass-morphism design** with backdrop blur effects
- **Smooth transitions** and hover animations
- **Mobile-responsive** layout

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | UI, interactivity, DOM control |
| **Backend** | Python (Flask) | API endpoints, data serving, compound mixing |
| **Data** | JSON | Element properties, compound database |
| **Styling** | CSS Grid, Flexbox | Responsive layouts, animations |
| **Audio** | Web Audio API | Sound effects for reactions |

## 📁 Project Structure

```
ChemCraft/
├── app.py                 # Flask backend with API endpoints
├── requirements.txt       # Python dependencies
├── data/
│   ├── elements.json     # Periodic table data (79 elements)
│   └── compounds.json    # Compound database (8 compounds)
├── static/
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       └── app.js        # Frontend JavaScript
├── templates/
│   └── index.html        # Main HTML template
├── test_setup.py         # Setup verification script
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone or download the project**
   ```bash
   cd ChemCraft
   ```

2. **Install dependencies**
   ```bash
   pip install Flask
   ```

   Or using requirements.txt:
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify setup** (optional)
   ```bash
   python test_setup.py
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   Navigate to: `http://localhost:5000`

## 🎮 How to Use

### 🔬 Exploring the Periodic Table
1. Click the **"Periodic Table"** tab
2. **Hover over elements** to see hover effects
3. **Click any element** to view detailed information including:
   - Atomic number and mass
   - Element category and properties
   - Physical properties (density, melting/boiling points)
   - Summary description

### ⚗️ Mixing Elements & Creating Compounds
1. Click the **"⚗️ Compound Mixer"** tab
2. **Select elements** from the mini periodic table
3. **Click "Mix Elements"** to create compounds
4. **View detailed results** including:
   - Chemical formula and name
   - Molecular mass and physical properties
   - Real-world uses and applications
   - Safety information and interesting facts
5. **Try "Random Compound"** for inspiration
6. **Experience visual animations** and audio feedback

### 🎯 Taking Quizzes
1. Click the **"Quiz Mode"** tab
2. Click **"New Question"** to start
3. **Select your answer** from the multiple choice options
4. **View instant feedback** with explanations
5. **Track your score** and progress

### 🔍 Searching Elements
1. Click the **"Element Search"** tab
2. **Type in the search box**: element name, symbol, or atomic number
3. **Click Search** or press Enter
4. **Browse results** with key information

## 🎨 Design Features

### Color Coding
Elements are color-coded by category:
- **🔴 Alkali metals** - Red
- **🟡 Alkaline earth metals** - Yellow
- **🔵 Transition metals** - Blue
- **🟣 Noble gases** - Purple
- **🟢 Metalloids** - Green
- And more...

### Responsive Design
- **Desktop**: Full periodic table grid layout
- **Mobile**: Optimized layout with smaller elements
- **Tablet**: Adaptive design that scales appropriately

## 🔧 API Endpoints

The Flask backend provides several API endpoints:

- `GET /api/elements` - Get all elements data
- `GET /api/element/<atomic_number>` - Get specific element
- `GET /api/compounds` - Get all compounds data
- `POST /api/mix` - Mix elements to create compounds
- `GET /api/random-compound` - Get random compound
- `GET /api/quiz/random` - Get random quiz question
- `GET /api/search?q=<query>` - Search elements

## 🎓 Educational Value

ChemCraft helps students learn:
- **Element symbols and names**
- **Atomic numbers and masses**
- **Element categories and properties**
- **Periodic table organization**
- **Chemical element relationships**
- **Compound formation and chemical formulas**
- **Molecular masses and stoichiometry**
- **Real-world applications of chemistry**
- **Chemical bonding types (ionic, covalent)**
- **Physical and chemical properties**

## 🔮 Future Enhancements

Potential features for expansion:
- **Complete periodic table** (currently includes 79 elements including synthetic superheavy elements)
- **Compound builder** game mode
- **Multiplayer quiz battles**
- **Progress tracking** with user accounts
- **Achievement system**
- **Audio feedback** and sound effects
- **Advanced quiz modes** with timers
- **Element comparison** tools

## 🤝 Contributing

This is an educational project perfect for:
- **School science projects**
- **Programming portfolio pieces**
- **Learning Flask and web development**
- **Chemistry education tools**

## 📜 License

This project is created for educational purposes. Feel free to use, modify, and distribute for educational use.

## 🙏 Acknowledgments

- Element data sourced from public periodic table databases
- Inspired by modern chemistry education needs
- Built with love for science and learning

---

**Happy Learning! 🧪✨**

*ChemCraft - Making Chemistry Fun, One Element at a Time!*
