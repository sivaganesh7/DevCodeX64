from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.rag.chunker import extract_chunks
from app.core.embeddings.provider import get_embedding_provider, EmbeddingProvider

router = APIRouter()

class EmbedFileRequest(BaseModel):
    repositoryId: str
    fileId: str
    filePath: str
    content: str
    language: Optional[str] = None

class EmbedFileResponse(BaseModel):
    chunks: List[Dict[str, Any]]

@router.post("/file", response_model=EmbedFileResponse)
async def embed_file(request: EmbedFileRequest):
    chunks = extract_chunks(request.content, request.language or "")
    provider = get_embedding_provider()
    
    if not chunks:
        return {"chunks": []}
    
    texts = [c["content"] for c in chunks]
    embeddings = await provider.generate_embeddings(texts)
    
    for idx, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[idx]
        
    return {"chunks": chunks}
