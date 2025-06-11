#!/bin/bash

# Script to install selected Ollama models to a custom directory
# Created for frontend interview content processing

# Use default Ollama models directory
unset OLLAMA_MODELS

# Display the default location
echo "Using default Ollama models directory: ~/.ollama/models"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Installing now..."
    curl -fsSL https://ollama.com/download/ollama-darwin-amd64 -o ollama
    chmod +x ollama
    sudo mv ollama /usr/local/bin/
    echo "Ollama installed successfully."
fi

# Function to pull a model and show progress
pull_model() {
    local model=$1
    local display_name=$2
    
    echo "========================================"
    echo "Pulling $display_name..."
    echo "========================================"
    
    # Pull the model
    ollama pull $model
    
    # Check if successful
    if [ $? -eq 0 ]; then
        echo "✅ $display_name installed successfully"
    else
        echo "❌ Failed to install $display_name"
    fi
    
    # Check model was pulled
    echo "Model installed successfully"
    echo ""
}

# Function to create extended token version of a model
create_extended_model() {
    local base_model=$1
    local extended_name=$2
    local ctx_size=$3
    
    echo "Creating extended token version: $extended_name..."
    
    # Create temporary modelfile
    cat > /tmp/$extended_name.modelfile << EOF
FROM $base_model
PARAMETER num_predict 32768
PARAMETER num_ctx $ctx_size
EOF
    
    # Create the model
    ollama create $extended_name -f /tmp/$extended_name.modelfile
    
    # Check if successful
    if [ $? -eq 0 ]; then
        echo "✅ Extended model $extended_name created successfully"
    else
        echo "❌ Failed to create extended model $extended_name"
    fi
    
    # Clean up
    rm /tmp/$extended_name.modelfile
    echo ""
}

# Start Ollama service if not running
echo "Ensuring Ollama service is running..."
ollama serve &>/dev/null &
OLLAMA_PID=$!
sleep 2

# Pull only the specified models
pull_model "deepseek-r1:14b" "DeepSeek R1 14B"
pull_model "deepseek-coder:6.7b" "DeepSeek Coder 6.7B"
pull_model "deepseek-coder-v2:16b" "DeepSeek Coder V2 16B"
pull_model "qwen3:8b" "Qwen3 8B"
pull_model "llama3" "LLaMA 3 8B"

echo "========================================"
echo "Creating extended token versions of models..."
echo "========================================"

# Create extended token versions
create_extended_model "deepseek-r1:14b" "deepseek-r1-14b-extended" "8192"
create_extended_model "deepseek-coder:6.7b" "deepseek-coder-extended" "8192"
create_extended_model "deepseek-coder-v2:16b" "deepseek-coder-v2-extended" "16384"
create_extended_model "qwen3:8b" "qwen3-extended" "32768"
create_extended_model "llama3" "llama3-extended" "8192"

echo "========================================"
echo "Installation Summary"
echo "========================================"
echo "Models installed to: ~/.ollama/models (default location)"
echo ""
echo "Available models:"
ollama list
echo ""
echo "To test a model, run:"
echo "ollama run deepseek-coder-extended"
echo ""
echo "Installation complete!"
