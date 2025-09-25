"""
Pydantic models for NexusAI HTML parser.
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, validator


class PriceNormalized(BaseModel):
    """Normalized price information."""
    
    raw: str = Field(..., description="Original raw text")
    amount: Optional[float] = Field(None, description="Primary amount")
    currency: Optional[str] = Field(None, description="Currency code or symbol")
    amount_float: Optional[float] = Field(None, description="Parsed amount as float")
    min_amount: Optional[float] = Field(None, description="Minimum amount for ranges")
    max_amount: Optional[float] = Field(None, description="Maximum amount for ranges")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence score")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        """Ensure confidence is between 0 and 1."""
        return max(0.0, min(1.0, v))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "raw": self.raw,
            "amount": self.amount,
            "currency": self.currency,
            "amount_float": self.amount_float,
            "min_amount": self.min_amount,
            "max_amount": self.max_amount,
            "confidence": self.confidence
        }


class DateNormalized(BaseModel):
    """Normalized date information."""
    
    raw: str = Field(..., description="Original raw text")
    iso_date: Optional[str] = Field(None, description="ISO 8601 formatted date")
    parsed_datetime: Optional[datetime] = Field(None, description="Parsed datetime object")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence score")
    partial: bool = Field(default=False, description="Whether date is partial/incomplete")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        """Ensure confidence is between 0 and 1."""
        return max(0.0, min(1.0, v))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "raw": self.raw,
            "iso_date": self.iso_date,
            "parsed_datetime": self.parsed_datetime.isoformat() if self.parsed_datetime else None,
            "confidence": self.confidence,
            "partial": self.partial
        }


class ExtractedField(BaseModel):
    """Extracted field from HTML with normalized values."""
    
    selector: str = Field(..., description="CSS selector used")
    raw_text: str = Field(..., description="Raw extracted text")
    clean_text: str = Field(..., description="Cleaned and normalized text")
    inner_html: Optional[str] = Field(None, description="Inner HTML content")
    price: Optional[PriceNormalized] = Field(None, description="Normalized price if detected")
    date: Optional[DateNormalized] = Field(None, description="Normalized date if detected")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        """Ensure confidence is between 0 and 1."""
        return max(0.0, min(1.0, v))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "selector": self.selector,
            "raw_text": self.raw_text,
            "clean_text": self.clean_text,
            "inner_html": self.inner_html,
            "price": self.price.to_dict() if self.price else None,
            "date": self.date.to_dict() if self.date else None,
            "confidence": self.confidence
        }


class ParsedDocument(BaseModel):
    """Complete parsed document with extracted information."""
    
    url: Optional[str] = Field(None, description="Source URL")
    title: Optional[str] = Field(None, description="Page title")
    meta_description: Optional[str] = Field(None, description="Meta description")
    language: Optional[str] = Field(None, description="Detected language code")
    extracted_fields: List[ExtractedField] = Field(default_factory=list, description="All extracted fields")
    prices: List[PriceNormalized] = Field(default_factory=list, description="All detected prices")
    dates: List[DateNormalized] = Field(default_factory=list, description="All detected dates")
    text_blocks: List[str] = Field(default_factory=list, description="Main text content blocks")
    
    def get_primary_price(self) -> Optional[PriceNormalized]:
        """Get the most confident price."""
        if not self.prices:
            return None
        return max(self.prices, key=lambda p: p.confidence)
    
    def get_primary_date(self) -> Optional[DateNormalized]:
        """Get the most confident date."""
        if not self.dates:
            return None
        return max(self.dates, key=lambda d: d.confidence)
    
    def get_prices_by_currency(self, currency: str) -> List[PriceNormalized]:
        """Get all prices for a specific currency."""
        return [p for p in self.prices if p.currency == currency]
    
    def get_price_range(self) -> Optional[Dict[str, float]]:
        """Get min/max price range across all prices."""
        amounts = []
        for price in self.prices:
            if price.amount is not None:
                amounts.append(price.amount)
            if price.min_amount is not None:
                amounts.append(price.min_amount)
            if price.max_amount is not None:
                amounts.append(price.max_amount)
        
        if not amounts:
            return None
        
        return {
            "min_price": min(amounts),
            "max_price": max(amounts)
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "url": self.url,
            "title": self.title,
            "meta_description": self.meta_description,
            "language": self.language,
            "extracted_fields": [field.to_dict() for field in self.extracted_fields],
            "prices": [price.to_dict() for price in self.prices],
            "dates": [date.to_dict() for date in self.dates],
            "text_blocks": self.text_blocks,
            "summary": {
                "total_fields": len(self.extracted_fields),
                "total_prices": len(self.prices),
                "total_dates": len(self.dates),
                "primary_price": self.get_primary_price().to_dict() if self.get_primary_price() else None,
                "primary_date": self.get_primary_date().to_dict() if self.get_primary_date() else None,
                "price_range": self.get_price_range()
            }
        }


class TableRow(BaseModel):
    """Represents a row in an extracted table."""
    
    row_index: int = Field(..., description="Row index in table")
    cells: Dict[str, str] = Field(..., description="Cell data by header name")
    raw_cells: List[str] = Field(default_factory=list, description="Raw cell values")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "row_index": self.row_index,
            "cells": self.cells,
            "raw_cells": self.raw_cells
        }


class ExtractedTable(BaseModel):
    """Extracted table with headers and rows."""
    
    selector: str = Field(..., description="CSS selector used")
    headers: List[str] = Field(default_factory=list, description="Table headers")
    rows: List[TableRow] = Field(default_factory=list, description="Table rows")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "selector": self.selector,
            "headers": self.headers,
            "rows": [row.to_dict() for row in self.rows],
            "row_count": len(self.rows),
            "column_count": len(self.headers),
            "confidence": self.confidence
        }