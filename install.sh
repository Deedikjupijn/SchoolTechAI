
#!/bin/bash

echo "Installing MetalWorks AI Assistant on Fedora Linux..."

# Check for and install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    sudo dnf install -y nodejs npm
fi

# Check node version and upgrade if needed
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [ "${NODE_VERSION%%.*}" -lt 20 ]; then
    echo "Upgrading Node.js to v20..."
    sudo dnf module reset nodejs -y
    sudo dnf module enable nodejs:20 -y
    sudo dnf install -y nodejs
fi

# Check for and install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo dnf install -y postgresql postgresql-server
    sudo postgresql-setup --initdb
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "DATABASE_URL=postgres://postgres:postgres@localhost:5432/metalworks" > .env
    echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
    echo "GEMINI_API_KEY=your-api-key-here" >> .env
fi

echo "Installation complete!"
echo "Before starting the application:"
echo "1. Configure your database connection in .env"
echo "2. Add your Gemini API key to .env"
echo ""
echo "To start the application in development mode:"
echo "npm run dev"
echo ""
echo "To build and start in production mode:"
echo "npm run build"
echo "npm run start"
