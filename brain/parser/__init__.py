"""
NexusAI HTML Parser and Data Cleaning Package

A comprehensive package for parsing HTML content, extracting structured data,
and normalizing prices, dates, and text with internationalization support.
"""

from .parser import Parser
from .schema import ParsedDocument, ExtractedField, PriceNormalized, DateNormalized
from .normalizers import normalize_price, normalize_date, normalize_text

__version__ = "1.0.0"
__author__ = "NexusAI Team"

__all__ = [
    "Parser",
    "ParsedDocument",
    "ExtractedField", 
    "PriceNormalized",
    "DateNormalized",
    "normalize_price",
    "normalize_date",
    "normalize_text"
]