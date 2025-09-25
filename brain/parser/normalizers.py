"""
Text, price, and date normalization utilities for NexusAI parser.
"""

import logging
import re
from datetime import datetime, timedelta
from typing import Optional, Union
from decimal import Decimal, InvalidOperation

from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta

from .schema import PriceNormalized, DateNormalized

logger = logging.getLogger(__name__)

# Currency mappings
CURRENCY_MAPPINGS = {
    "₹": "INR",
    "Rs.": "INR", 
    "Rs": "INR",
    "INR": "INR",
    "rupees": "INR",
    "rupee": "INR",
    "$": "USD",
    "USD": "USD",
    "dollars": "USD",
    "dollar": "USD",
    "€": "EUR",
    "EUR": "EUR",
    "euros": "EUR",
    "euro": "EUR",
    "£": "GBP",
    "GBP": "GBP",
    "pounds": "GBP",
    "pound": "GBP",
    "¥": "JPY",
    "JPY": "JPY",
    "yen": "JPY",
    "¢": "USD",  # cents
    "cents": "USD",
    "cent": "USD"
}

# Price regex patterns
PRICE_PATTERNS = [
    # Currency symbol followed by number: $1,234.56, ₹45,000
    r'([₹$€£¥¢])\s*([0-9,]+(?:\.[0-9]{1,2})?)',
    # Number followed by currency: 1234.56 USD, 45000 INR
    r'([0-9,]+(?:\.[0-9]{1,2})?)\s*([A-Za-z]{3}|Rs\.?|rupees?|dollars?|euros?|pounds?|yen|cents?)',
    # Range patterns: ₹40,000 - ₹45,000, $10-15
    r'([₹$€£¥¢])\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*[-–—]\s*([₹$€£¥¢])\s*([0-9,]+(?:\.[0-9]{1,2})?)',
    # Number range with currency at end: 40,000 - 45,000 INR
    r'([0-9,]+(?:\.[0-9]{1,2})?)\s*[-–—]\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*([A-Za-z]{3}|Rs\.?|rupees?)',
    # Simple number patterns (fallback): 12345, 1,234
    r'([0-9,]+(?:\.[0-9]{1,2})?)'
]

# Date relative patterns
RELATIVE_DATE_PATTERNS = [
    (r'(\d+)\s+days?\s+ago', lambda m: datetime.now() - timedelta(days=int(m.group(1)))),
    (r'(\d+)\s+weeks?\s+ago', lambda m: datetime.now() - timedelta(weeks=int(m.group(1)))),
    (r'(\d+)\s+months?\s+ago', lambda m: datetime.now() - relativedelta(months=int(m.group(1)))),
    (r'(\d+)\s+years?\s+ago', lambda m: datetime.now() - relativedelta(years=int(m.group(1)))),
    (r'yesterday', lambda m: datetime.now() - timedelta(days=1)),
    (r'today', lambda m: datetime.now()),
    (r'tomorrow', lambda m: datetime.now() + timedelta(days=1)),
]


def normalize_text(text: str) -> str:
    """
    Normalize and clean text content.
    
    Args:
        text: Raw text to normalize
        
    Returns:
        Cleaned and normalized text
    """
    if not text:
        return ""
    
    # Remove extra whitespace and normalize unicode
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    
    # Remove or replace problematic unicode characters
    text = text.replace('\u00a0', ' ')  # Non-breaking space
    text = text.replace('\u2009', ' ')  # Thin space
    text = text.replace('\u200b', '')   # Zero-width space
    text = text.replace('\ufeff', '')   # Byte order mark
    
    # Clean up quotes and dashes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    text = text.replace('–', '-').replace('—', '-')
    
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\t\n\r')
    
    return text.strip()


def _parse_number(num_str: str) -> Optional[float]:
    """Parse a number string, handling commas and decimals."""
    if not num_str:
        return None
    
    # Remove commas and spaces
    clean_num = num_str.replace(',', '').replace(' ', '')
    
    try:
        return float(clean_num)
    except (ValueError, TypeError):
        logger.debug(f"Could not parse number: {num_str}")
        return None


def _detect_currency(text: str, currency_hint: Optional[str] = None) -> Optional[str]:
    """Detect currency from text or hint."""
    if currency_hint and currency_hint in CURRENCY_MAPPINGS:
        return CURRENCY_MAPPINGS[currency_hint]
    
    text_lower = text.lower()
    
    # Check for currency symbols and words
    for symbol, code in CURRENCY_MAPPINGS.items():
        if symbol.lower() in text_lower:
            return code
    
    return None


def normalize_price(text: str, currency_hint: Optional[str] = None) -> PriceNormalized:
    """
    Normalize price information from text.
    
    Args:
        text: Text containing price information
        currency_hint: Optional currency hint for better parsing
        
    Returns:
        PriceNormalized object with extracted price data
    """
    if not text:
        return PriceNormalized(raw=text, confidence=0.0)
    
    clean_text = normalize_text(text)
    logger.debug(f"Normalizing price: '{clean_text}'")
    
    # Try price-parser first
    try:
        from price_parser import Price
        
        parsed_price = Price.fromstring(clean_text)
        if parsed_price.amount is not None:
            currency = parsed_price.currency or _detect_currency(clean_text, currency_hint)
            
            return PriceNormalized(
                raw=text,
                amount=float(parsed_price.amount),
                currency=currency,
                amount_float=float(parsed_price.amount),
                confidence=0.9
            )
    except ImportError:
        logger.warning("price-parser not available, using regex fallback")
    except Exception as e:
        logger.debug(f"price-parser failed: {e}")
    
    # Fallback to regex patterns
    best_match = None
    best_confidence = 0.0
    
    for pattern in PRICE_PATTERNS:
        matches = re.finditer(pattern, clean_text, re.IGNORECASE)
        
        for match in matches:
            groups = match.groups()
            
            if len(groups) == 2:  # Currency + amount or amount + currency
                if groups[0] in CURRENCY_MAPPINGS:  # Currency first
                    currency_symbol, amount_str = groups
                    currency = CURRENCY_MAPPINGS.get(currency_symbol)
                    amount = _parse_number(amount_str)
                elif groups[1] in CURRENCY_MAPPINGS or groups[1].lower() in [k.lower() for k in CURRENCY_MAPPINGS]:  # Currency second
                    amount_str, currency_symbol = groups
                    currency = CURRENCY_MAPPINGS.get(currency_symbol) or CURRENCY_MAPPINGS.get(currency_symbol.lower())
                    amount = _parse_number(amount_str)
                else:
                    continue
                
                if amount is not None:
                    confidence = 0.8
                    if currency:
                        confidence = 0.85
                    
                    if confidence > best_confidence:
                        best_match = PriceNormalized(
                            raw=text,
                            amount=amount,
                            currency=currency,
                            amount_float=amount,
                            confidence=confidence
                        )
                        best_confidence = confidence
            
            elif len(groups) == 4:  # Range pattern: $10 - $20
                curr1, amt1, curr2, amt2 = groups
                currency = CURRENCY_MAPPINGS.get(curr1) or CURRENCY_MAPPINGS.get(curr2)
                min_amount = _parse_number(amt1)
                max_amount = _parse_number(amt2)
                
                if min_amount is not None and max_amount is not None:
                    avg_amount = (min_amount + max_amount) / 2
                    confidence = 0.9 if currency else 0.7
                    
                    if confidence > best_confidence:
                        best_match = PriceNormalized(
                            raw=text,
                            amount=avg_amount,
                            currency=currency,
                            amount_float=avg_amount,
                            min_amount=min_amount,
                            max_amount=max_amount,
                            confidence=confidence
                        )
                        best_confidence = confidence
            
            elif len(groups) == 3:  # Range with currency at end: 10 - 20 USD
                amt1, amt2, currency_symbol = groups
                currency = CURRENCY_MAPPINGS.get(currency_symbol) or CURRENCY_MAPPINGS.get(currency_symbol.lower())
                min_amount = _parse_number(amt1)
                max_amount = _parse_number(amt2)
                
                if min_amount is not None and max_amount is not None:
                    avg_amount = (min_amount + max_amount) / 2
                    confidence = 0.85 if currency else 0.6
                    
                    if confidence > best_confidence:
                        best_match = PriceNormalized(
                            raw=text,
                            amount=avg_amount,
                            currency=currency,
                            amount_float=avg_amount,
                            min_amount=min_amount,
                            max_amount=max_amount,
                            confidence=confidence
                        )
                        best_confidence = confidence
            
            elif len(groups) == 1:  # Just a number
                amount_str = groups[0]
                amount = _parse_number(amount_str)
                
                if amount is not None and amount > 0:
                    currency = _detect_currency(clean_text, currency_hint)
                    confidence = 0.3 if not currency else 0.5
                    
                    # Boost confidence for larger numbers (likely prices)
                    if amount > 100:
                        confidence += 0.2
                    if amount > 1000:
                        confidence += 0.1
                    
                    confidence = min(confidence, 1.0)
                    
                    if confidence > best_confidence:
                        best_match = PriceNormalized(
                            raw=text,
                            amount=amount,
                            currency=currency,
                            amount_float=amount,
                            confidence=confidence
                        )
                        best_confidence = confidence
    
    if best_match:
        return best_match
    
    # No matches found
    return PriceNormalized(raw=text, confidence=0.0)


def normalize_date(text: str, locale: Optional[str] = None) -> DateNormalized:
    """
    Normalize date information from text.
    
    Args:
        text: Text containing date information
        locale: Optional locale hint for better parsing
        
    Returns:
        DateNormalized object with extracted date data
    """
    if not text:
        return DateNormalized(raw=text, confidence=0.0)
    
    clean_text = normalize_text(text)
    logger.debug(f"Normalizing date: '{clean_text}'")
    
    # Check relative date patterns first
    for pattern, date_func in RELATIVE_DATE_PATTERNS:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            try:
                parsed_dt = date_func(match)
                return DateNormalized(
                    raw=text,
                    iso_date=parsed_dt.date().isoformat(),
                    parsed_datetime=parsed_dt,
                    confidence=0.9
                )
            except Exception as e:
                logger.debug(f"Relative date parsing failed: {e}")
    
    # Try dateutil parser with fuzzy matching
    try:
        parsed_dt = dateutil_parser.parse(clean_text, fuzzy=True)
        confidence = 0.8
        partial = False
        
        # Check if the original text had partial information
        if not re.search(r'\d{4}', clean_text):  # No year
            partial = True
            confidence = 0.6
        elif not re.search(r'\d{1,2}', clean_text):  # No day
            partial = True
            confidence = 0.7
        
        # Boost confidence for more complete dates
        if re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{4}', clean_text):  # MM/DD/YYYY format
            confidence = 0.9
        elif re.search(r'\w+\s+\d{1,2},?\s+\d{4}', clean_text):  # "March 5, 2024" format
            confidence = 0.95
        
        return DateNormalized(
            raw=text,
            iso_date=parsed_dt.date().isoformat(),
            parsed_datetime=parsed_dt,
            confidence=confidence,
            partial=partial
        )
        
    except (ValueError, TypeError) as e:
        logger.debug(f"Date parsing failed with dateutil: {e}")
    
    # Try to extract just year, month, or day
    year_match = re.search(r'\b(19|20)\d{2}\b', clean_text)
    if year_match:
        try:
            year = int(year_match.group())
            parsed_dt = datetime(year, 1, 1)
            return DateNormalized(
                raw=text,
                iso_date=parsed_dt.date().isoformat(),
                parsed_datetime=parsed_dt,
                confidence=0.4,
                partial=True
            )
        except ValueError:
            pass
    
    # Look for month names
    month_match = re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b', clean_text, re.IGNORECASE)
    if month_match:
        try:
            # Try to parse with current year
            current_year = datetime.now().year
            test_text = f"{month_match.group()} {current_year}"
            parsed_dt = dateutil_parser.parse(test_text, fuzzy=True)
            return DateNormalized(
                raw=text,
                iso_date=parsed_dt.date().isoformat(),
                parsed_datetime=parsed_dt,
                confidence=0.3,
                partial=True
            )
        except Exception:
            pass
    
    # No successful parsing
    return DateNormalized(raw=text, confidence=0.0)