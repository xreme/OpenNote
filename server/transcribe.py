import whisper
import json
import sys
import os
import torch

def transcribe(file_path, model_name="base", device="auto"):
    # Auto-detect GPU, fallback to CPU
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    print(f"Using device: {device}", file=sys.stderr)
    
    model = whisper.load_model(model_name, device=device)
    result = model.transcribe(file_path)
    
    segments = []
    for segment in result['segments']:
        segments.append({
            'start': segment['start'],
            'end': segment['end'],
            'speech': segment['text'].strip()
        })
    
    return segments

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"
    
    try:
        segments = transcribe(file_path, model_name, device="auto")
        print(json.dumps(segments))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
