# Seismic Monitoring using Distributed Acoustic Sensing (DAS)

An industry-academic project developed in collaboration with **SkillGenX AI**, focused on high-precision seismic event detection and classification using fiber-optic sensing technology.

## 📁 Project Overview
This project leverages **Distributed Acoustic Sensing (DAS)** to transform standard fiber-optic cables into a dense array of seismic sensors. By processing acoustic signals, the system monitors, detects, and classifies geological and human-induced events in real-time.

### 🎯 Classification Categories
The models are trained to classify four primary event types:
1.  **Rockfall:** Sudden movements of rock masses.
2.  **Landslide:** Mass wasting and slope failures.
3.  **Anthropogenic:** Human-made vibrations (vehicles, construction, footsteps).
4.  **Ambient Noise:** Natural background environmental noise.

---

## 📊 Data Processing & Input Formats
The system utilizes multi-modal data processing to improve detection accuracy:
*   **Waveforms:** Raw 1D time-series acoustic signals.
*   **Spectrograms:** Time-frequency representations capturing spectral signatures.
*   **CSDMs (Cross-Spectral Density Matrices):** Analyzing spatial-spectral relationships across the DAS fiber array.

---

## 🤖 Machine Learning Architecture

### 1. Supervised Learning (`Supervised_code.ipynb`)
We evaluated **three different supervised Deep Learning architectures** (CNN-based) to identify the most robust model for classifying the four event categories. These models provide high-precision detection and automated labeling of seismic signatures.

### 2. Unsupervised Learning (`autoencoder_code.ipynb`)
To handle anomaly detection and feature extraction, an **Vector-Quantized Autoencoder** was implemented.
*   **Logic:** The model learns the "Ambient Noise" baseline. Any significant reconstruction error flags a potential event (Rockfall, Landslide, etc.), allowing for the detection of novel or rare seismic activities.

### 3. Streamlit Prototype (`app.py`)
A functional web dashboard to demonstrate the monitoring system in action.
*   **Visualization:** View processed Waveforms, Spectrograms, and CSDMs.
*   **Inference:** Run trained models to get instant classification results and confidence scores on sample data.

---

## 🚀 Getting Started

1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/vishwa21-prog/Seismic-Monitoring-using-Distributive-Acoustic-Sensing.git
    cd Seismic-Monitoring-using-Distributive-Acoustic-Sensing
    ```

2.  **Install Dependencies:**
    ```bash
    pip install streamlit torch numpy matplotlib scipy pandas
    ```

3.  **Launch the App:**
    ```bash
    streamlit run app.py
    ```

---

## 🔒 Dataset Privacy
The DAS datasets used in this project are **proprietary and private**. They are not included in this repository and cannot be shared publicly due to industry confidentiality agreements with **SkillGenX AI**.
