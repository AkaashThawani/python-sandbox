# Python Code Sandbox

# Description
This full-stack web application provides a secure online Python code execution environment. Users can write, run, and test Python scripts directly in their browser with built-in support for data science libraries like pandas and numpy. The application consists of a modern React frontend built with Next.js and a Flask API backend that safely executes user-submitted code in an isolated environment, returning results in real-time.

## Key Features
- **Interactive Code Editor**: Write Python code with syntax highlighting in a responsive web interface
- **Safe Code Execution**: Server-side execution prevents local security risks and provides isolated runtimes
- **Data Science Support**: Pre-installed pandas and numpy for data analysis and manipulation
- **Real-Time Output**: View stdout, errors, and JSON-serializable return values immediately after execution
- **Code Wrapping**: User code is automatically wrapped in a `main()` function for proper execution
- **Responsive Design**: Works seamlessly on desktop and mobile devices with Tailwind CSS styling

## Architecture
- **Frontend**: Next.js application with React components for code editing and output display
- **Backend**: Flask API that receives code via POST requests and executes it securely
- **Communication**: REST API using JSON payloads for code transmission and result retrieval
- **Isolation**: Backend runs Python scripts in isolated processes to prevent system interference

## Links
- **Backend Repository**: [Python Code Execution API](https://github.com/AkaashThawani/flaskAPI)
- **Frontend Repository**: [Python Code Sandbox](https://github.com/AkaashThawani/python-sandbox)

## Tech Stack
### Frontend
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript for type safety
- **UI/Styling**: Tailwind CSS v4 with custom gradients and responsive design
- **Runtime**: React 19 with hooks for state management
- **Package Manager**: npm

### Backend (API)
- **Framework**: Flask for lightweight web API
- **Language**: Python runtime environment
- **Libraries**: pandas, numpy for data operations
- **Security**: Isolated execution to prevent malicious code

### Development Tools
- **Linting**: ESLint with Next.js configuration
- **Build**: Turbopack for fast development compilation
- **Fonts**: Optimized Geist font family from Vercel

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with Flask, pandas, and numpy
- Git

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AkaashThawani/python-sandbox.git
   cd python-sandbox
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up backend environment (ensure Flask API is running separately):
   - Configure `NEXT_PUBLIC_FLASK_API_URL` in `.env.local`
   - Backend should be running on the specified URL

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage
1. Write your Python code in the left panel (examples with pandas are pre-filled)
2. Click "Run Script" to execute
3. View results in the right panel: stdout, errors, and returned values
4. Use "Clear" button to reset the editor

Example code:
```python
import pandas as pd
import numpy as np

# Sample data analysis
data = {'col1': [1, 2, 3], 'col2': ['A', 'B', 'C']}
df = pd.DataFrame(data)

# Process data
print("Data shape:", df.shape)
print(df.head())

# Return results
return {
    "data_shape": df.shape,
    "columns": df.columns.tolist(),
    "sample_rows": df.head(2).to_dict('records')
}
```

## Available Scripts
- `npm run dev` - Start development server with Turbopack (hot reload)
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Structure
```
python-sandbox/
├── src/app/
│   ├── globals.css          # Global Tailwind styles
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Main application page
│   └── spinner.tsx          # Loading spinner component
├── public/                  # Static assets (icons, images)
├── package.json             # Frontend dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## API Specification
### POST /execute
Executes Python code and returns results.

**Request:**
```json
{
  "script": "def main():\\n    return {'test': 'value'}"
}
```

**Response:**
```json
{
  "stdout": "Optional stdout output",
  "result": { "test": "value" },
  "error": "Optional error message"
}
```

## Security Considerations
- Code execution is sandboxed on the server side
- User input is validated and wrapped in safe functions
- No direct file system access for user code
- Rate limiting and request size limits should be implemented in production

## Development
- Frontend uses Next.js App Router for modern React patterns
- TypeScript ensures type safety across the application
- Tailwind provides utility-first CSS with custom design system
- Hot reloading enables fast development cycles

## Deployment
The frontend can be deployed on Vercel with environment variables for API configuration. The Flask backend should be deployed separately (e.g., on Heroku, DigitalOcean, or cloud functions).
