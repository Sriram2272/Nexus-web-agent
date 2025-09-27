# NexusAI - UI-Only Model Picker

## Installation

The model picker has been integrated into the existing NexusAI search bar. It consists of:

- **ModelChip.tsx** - Small chip inside search input showing current model status
- **ModelPickerModal.tsx** - Full modal for selecting, downloading, and managing models

## Features

### Model Chip
- Shows "Local: ON/OFF" status with colored indicator
- Hover tooltip displays model name and behavior description
- Click or `Ctrl/Cmd+M` opens the model picker modal

### Model Picker Modal
- **Local Models**: Available immediately (green dot indicator)
- **Downloadable Models**: Can be downloaded with simulated progress (download icon)
- **Cloud Models**: Display only, not available for download (cloud icon)
- **Search**: Filter models by name or description
- **Pin as Default**: Save selected model to localStorage as default
- **Keyboard Navigation**: Use Esc to close, arrow keys to navigate

### Mock Data & Persistence
- All model data is client-side mock data
- Downloaded models saved to `localStorage` under `nexus_model_downloaded`
- Default/pinned model saved to `localStorage` under `nexus_model_primary`
- Simulated download progress with cancel option

### Model Descriptions (Exact)

- `smollm2:135m` — "Tiny & fast — quick replies, limited depth."
- `llama2:7b/13b/70b` — "Generalist — balanced summarization & chat."
- `llama3.2:13b/70b` — "Instruction-tuned multilingual for dialogue & summaries."
- `gemma3:4b/12b/27b` — "Efficient reasoning & instruction-following."
- `qwen3:4b/8b/30b` — "Optimized language & code models."
- `gpt-oss:20b/120b` — "Open-source GPT-style generalist."
- `deepsseek-v3:671b` — "High-performance large-scale model (cloud available)."
- `llava` — "Vision+Language — image-aware queries/screenshots."
- `granite:128k` — "Long-context reasoning (128K tokens) for big transcripts."
- `bge-m3` — "Fast embeddings for semantic search & transcript indexing."
- `general-local` — "General-purpose local model."

## Usage

The ModelChip is already integrated into the search bar in `src/components/SearchInterface.tsx` at line 207-215. No additional setup required.

### Keyboard Shortcuts
- `Ctrl/Cmd+M` - Open model picker modal
- `Esc` - Close modal
- `Enter` - Select highlighted model
- `Space` - Toggle fallback selection (if implemented)

## Storage Keys

- `nexus_model_primary` - Currently selected/pinned model name
- `nexus_model_downloaded` - Array of downloaded model names

## Architecture

This is a **UI-only implementation** with:
- No backend API calls
- Mock data for all models
- localStorage for persistence
- Simulated download progress
- Client-side state management

Perfect for prototyping and development without requiring Ollama backend setup.