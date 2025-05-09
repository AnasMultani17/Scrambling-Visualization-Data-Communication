# 📡 Scrambling Visualizer (B8ZS / HDB3)

An interactive web-based visualization tool to demonstrate the operation of two widely used line coding schemes: **B8ZS (Bipolar with 8-Zero Substitution)** and **HDB3 (High-Density Bipolar 3 Zeros)**. Users can input a binary bitstream and observe how scrambling is applied and visualized in real-time on a canvas.

---

## 🔍 Features

- 💻 Simple and responsive UI for ease of use  
- 🧠 Supports B8ZS and HDB3 scrambling schemes  
- 🎞️ Step-by-step animation with play/pause and seek controls  
- ⏱ Adjustable animation speed  
- 🎨 Clean signal rendering using HTML5 Canvas  
- 🔍 Bit-level step tracking with visual highlights  
- 📊 Legend explaining waveform color semantics  

---

## 🗂 Project Structure

.
├── index.html # Main HTML structure and layout  
├── styles.css # Theme, layout, and visual styling  
└── script.js # Functionality and logic for animation & algorithms
---

## 🚀 Getting Started

1. **Clone or Download** this repository.

2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).

3. Enter a binary string like:
   1000011000110000000010000

4. Click **"Plot Initial"** to begin.

5. Choose your scrambling algorithm: **B8ZS** or **HDB3**.

6. Use **Play/Pause**, **Speed Control**, and **Seek** to explore step-by-step signal transformation.

---

## 🧮 Algorithms Implemented

- **AMI (Alternate Mark Inversion)** forms the base line coding.
- **B8ZS** replaces 8 consecutive zeros with predefined violation/substitution patterns.
- **HDB3** replaces 4 consecutive zeros, depending on:
- The polarity of the last non-zero pulse.
- The number of pulses since the last violation.

---

## 🎨 Color Legend

| Signal Type         | Color       |
|---------------------|-------------|
| `0` Voltage Level   | Gray        |
| `+V` Pulse          | Cyan        |
| `−V` Pulse          | Magenta     |
| Violation/Mark Bit  | Yellow Box  |

---

## 📸 Preview

The visualizer generates a waveform where every bit is translated into a signal level and drawn dynamically on a canvas. Special markers are added for substitution/violation bits.

---

## 🛠 Tech Stack

- **HTML5**
- **CSS3** (with CSS Variables, Responsive Design)
- **JavaScript** (DOM manipulation, Canvas API, Event Handling)

---

## 📄 License

This project is open-source and free to use for **educational** and **personal** purposes. Attribution is appreciated.

