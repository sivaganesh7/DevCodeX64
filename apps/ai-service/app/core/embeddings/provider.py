from abc import ABC, abstractmethod
from typing import List
import os

class EmbeddingProvider(ABC):
    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        pass

class MockEmbeddingProvider(EmbeddingProvider):
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [[0.1] * 1536 for _ in texts]

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        import openai
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))
        self.model = os.getenv("AI_EMBEDDING_MODEL", "text-embedding-3-small")
        
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(input=texts, model=self.model)
        return [data.embedding for data in response.data]

def get_embedding_provider() -> EmbeddingProvider:
    if os.getenv("OPENAI_API_KEY"):
        return OpenAIEmbeddingProvider()
    return MockEmbeddingProvider()
