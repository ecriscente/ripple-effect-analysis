# Ripple Effect Analysis

"Ripple Effect Analysis" is a web application designed to automate the "Ripple Effect Analysis" framework. It allows users to input an emerging technology and receive a structured analysis of its direct consequences, human-societal reactions, and potential business opportunities.

## Project Structure

- `backend/`: Contains the FastAPI backend.
- `frontend/`: Contains the React/TypeScript frontend.

## Setup and Running Instructions

### Prerequisites

- Python 3.8+
- Node.js (LTS version) and npm

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a Python virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in the `backend` directory and add your Gemini API key:
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```
    Replace `YOUR_GEMINI_API_KEY` with your actual API key.
5.  Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the Node.js dependencies:
    ```bash
    npm install
    ```
3.  Run the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend will typically be running at `http://localhost:5173` (or another available port).

### Usage

1.  Ensure both the backend and frontend servers are running.
2.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
3.  Enter an emerging technology in the input field and click "Analyze" to get the Ripple Effect Analysis.
