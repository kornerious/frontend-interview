#!/bin/bash

# Script to start both the Next.js app and Ollama server
# Created for frontend interview content processing

echo "========================================"
echo "Starting Frontend Interview App with Local LLM Support"
echo "========================================"

# Check if Ollama is already running
if pgrep -x "ollama" > /dev/null
then
    echo "✅ Ollama is already running"
else
    echo "Starting Ollama server..."
    # Start Ollama in the background
    ollama serve &
    OLLAMA_PID=$!
    echo "✅ Ollama started with PID: $OLLAMA_PID"
    
    # Give Ollama a moment to initialize
    echo "Waiting for Ollama to initialize..."
    sleep 3
fi

# Check if Ollama is responding
echo "Checking Ollama API..."
if curl -s http://localhost:11434/api/version > /dev/null
then
    echo "✅ Ollama API is responding"
else
    echo "❌ Ollama API is not responding. Please check if Ollama is installed correctly."
    exit 1
fi

# List available models
echo "Available models:"
ollama list

echo "========================================"
echo "Starting Next.js application..."
echo "========================================"

# Start the Next.js app
npm run dev

# Note: When the Next.js app is terminated, this script will also terminate
# If you started Ollama from this script, you may want to stop it manually with:
# pkill ollama
echo "========================================"
echo "Application terminated"
echo "========================================"
echo "To stop Ollama server if needed: pkill ollama"
