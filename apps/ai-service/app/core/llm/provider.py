from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
import json

class LLMProvider(ABC):
    @abstractmethod
    async def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        pass

class MockLLMProvider(LLMProvider):
    async def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        return json.dumps({
            "answer": "This is a mocked answer because no OpenAI key is set.",
            "confidence": "low",
            "sources": [],
            "riskContext": [],
            "securityContext": []
        })

class OpenAILLMProvider(LLMProvider):
    def __init__(self):
        import openai
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))
        self.model = os.getenv("AI_MODEL", "gpt-4o-mini")
        
    async def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

def get_llm_provider() -> LLMProvider:
    if os.getenv("OPENAI_API_KEY"):
        return OpenAILLMProvider()
    return MockLLMProvider()
