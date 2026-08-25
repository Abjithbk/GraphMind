from typing import Literal

from pydantic import BaseModel, Field


class Entity(BaseModel):
    name: str = Field(description="The specific name of the entity (e.g., 'Transformer', 'Attention is All You Need')")
    type: Literal["Paper", "Method", "Claim"] = Field(description="The type of the entity")


class Relationship(BaseModel):
    source: str = Field(description="The name of the source entity")
    target: str = Field(description="The name of the target entity")
    type: Literal["uses_method", "makes_claim"] = Field(description="The type of the relationship")


class ExtractionResult(BaseModel):
    paper_title: str = Field(description="The title of the paper being analyzed")
    entities: list[Entity] = Field(description="List of extracted entities")
    relationships: list[Relationship] = Field(description="List of relationship between entities")
