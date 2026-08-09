import re
from typing import List, Dict, Any

def chunk_text_sliding_window(text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
    # Fallback semantic/sliding-window chunking
    lines = text.split("\n")
    chunks = []
    current_chunk_lines = []
    current_len = 0
    start_line = 1
    
    for i, line in enumerate(lines):
        line_len = len(line)
        current_chunk_lines.append(line)
        current_len += line_len
        
        if current_len > chunk_size or i == len(lines) - 1:
            chunk_content = "\n".join(current_chunk_lines)
            end_line = i + 1
            chunks.append({
                "content": chunk_content,
                "startLine": start_line,
                "endLine": end_line,
                "chunkType": "SECTION",
                "symbol": None
            })
            
            # overlap
            overlap_lines = current_chunk_lines[-min(len(current_chunk_lines), 5):]
            current_chunk_lines = overlap_lines
            current_len = sum(len(l) for l in overlap_lines)
            start_line = end_line - len(overlap_lines) + 1
            
    return chunks

def extract_chunks(content: str, language: str) -> List[Dict[str, Any]]:
    # Simple semantic fallback for now
    return chunk_text_sliding_window(content)
