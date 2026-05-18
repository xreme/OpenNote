import warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

import whisper
import json
import sys
import subprocess
import torch

def has_audio_stream(file_path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=codec_type",
         "-of", "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True, text=True
    )
    return bool(result.stdout.strip())

def transcribe(file_path, model_name="base", device="auto"):
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"

    model = whisper.load_model(model_name, device=device)
    result = model.transcribe(file_path, fp16=(device == "cuda"))
    
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
        if not has_audio_stream(file_path):
            print(json.dumps([]))
            sys.exit(0)
        segments = transcribe(file_path, model_name, device="auto")
        print(json.dumps(segments))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
