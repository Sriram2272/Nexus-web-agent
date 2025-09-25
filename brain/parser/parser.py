"""
Main HTML parser implementation for NexusAI.
"""

import logging
from typing import List, Optional, Dict, Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from .schema import ParsedDocument, ExtractedField, ExtractedTable, TableRow, PriceNormalized, DateNormalized
from .normalizers import normalize_price, normalize_date, normalize_text
from .utils import (
    strip_html_noise, safe_select, extract_visible_text, extract_main_content,
    extract_meta_tags, detect_language, is_likely_price_element, is_likely_date_element,
    split_text_blocks
)

logger = logging.getLogger(__name__)


class Parser:
    """
    Main HTML parser for extracting structured data from web content.
    """
    
    def __init__(self, 
                 strip_noise: bool = True,
                 detect_lang: bool = True,
                 currency_hint: Optional[str] = None,
                 locale: Optional[str] = None):
        """
        Initialize the parser.
        
        Args:
            strip_noise: Whether to remove noise elements
            detect_lang: Whether to detect language
            currency_hint: Default currency hint for price parsing
            locale: Default locale for date parsing
        """
        self.strip_noise = strip_noise
        self.detect_lang = detect_lang
        self.currency_hint = currency_hint
        self.locale = locale
        
        # Configure logging
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(levelname)s - %(name)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
    
    def parse_html(self, html: str, base_url: Optional[str] = None) -> ParsedDocument:
        """
        Parse HTML content and extract structured information.
        
        Args:
            html: HTML content to parse
            base_url: Optional base URL for resolving relative links
            
        Returns:
            ParsedDocument with extracted information
        """
        if not html:
            return ParsedDocument(url=base_url)
        
        logger.info(f"Parsing HTML document (length: {len(html)})")
        
        # Clean HTML if requested
        if self.strip_noise:
            html = strip_html_noise(html)
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract meta information
        meta_info = extract_meta_tags(soup)
        title = meta_info.get('title') or meta_info.get('og_title') or meta_info.get('twitter_title')
        description = (meta_info.get('description') or 
                      meta_info.get('og_description') or 
                      meta_info.get('twitter_description'))
        
        # Extract main content
        text_blocks = extract_main_content(soup)
        
        # Detect language
        language = None
        if self.detect_lang and text_blocks:
            language = detect_language(' '.join(text_blocks[:3]))  # Use first few blocks
            if not language:
                language = meta_info.get('lang')
        
        # Find and extract all potential data fields
        extracted_fields = []
        all_prices = []
        all_dates = []
        
        # Look for price elements
        for element in soup.find_all(True):
            if is_likely_price_element(element):
                field = self._extract_field_from_element(element, base_url)
                if field:
                    extracted_fields.append(field)
                    if field.price:
                        all_prices.append(field.price)
        
        # Look for date elements
        for element in soup.find_all(True):
            if is_likely_date_element(element):
                field = self._extract_field_from_element(element, base_url)
                if field:
                    # Avoid duplicates
                    if not any(f.raw_text == field.raw_text for f in extracted_fields):
                        extracted_fields.append(field)
                    if field.date:
                        all_dates.append(field.date)
        
        # Extract additional prices and dates from all text content
        all_text = ' '.join(text_blocks)
        additional_prices = self._extract_prices_from_text(all_text)
        additional_dates = self._extract_dates_from_text(all_text)
        
        # Merge and deduplicate
        all_prices.extend(additional_prices)
        all_dates.extend(additional_dates)
        
        # Remove duplicates based on raw text
        unique_prices = []
        seen_price_texts = set()
        for price in all_prices:
            if price.raw not in seen_price_texts:
                unique_prices.append(price)
                seen_price_texts.add(price.raw)
        
        unique_dates = []
        seen_date_texts = set()
        for date in all_dates:
            if date.raw not in seen_date_texts:
                unique_dates.append(date)
                seen_date_texts.add(date.raw)
        
        logger.info(f"Extracted {len(extracted_fields)} fields, {len(unique_prices)} prices, {len(unique_dates)} dates")
        
        return ParsedDocument(
            url=base_url,
            title=title,
            meta_description=description,
            language=language,
            extracted_fields=extracted_fields,
            prices=unique_prices,
            dates=unique_dates,
            text_blocks=text_blocks
        )
    
    def extract_by_selector(self, html: str, selector: str, base_url: Optional[str] = None) -> List[ExtractedField]:
        """
        Extract specific elements using CSS selector.
        
        Args:
            html: HTML content
            selector: CSS selector
            base_url: Optional base URL
            
        Returns:
            List of extracted fields
        """
        if not html:
            return []
        
        logger.info(f"Extracting elements with selector: '{selector}'")
        
        # Clean HTML if requested
        if self.strip_noise:
            html = strip_html_noise(html)
        
        soup = BeautifulSoup(html, 'html.parser')
        elements = safe_select(soup, selector)
        
        extracted_fields = []
        for element in elements:
            field = self._extract_field_from_element(element, base_url, selector)
            if field:
                extracted_fields.append(field)
        
        logger.info(f"Extracted {len(extracted_fields)} fields")
        return extracted_fields
    
    def parse_table(self, html: str, selector: str) -> ExtractedTable:
        """
        Extract HTML table into structured format.
        
        Args:
            html: HTML content
            selector: CSS selector for table
            
        Returns:
            ExtractedTable with headers and rows
        """
        if not html:
            return ExtractedTable(selector=selector)
        
        logger.info(f"Parsing table with selector: '{selector}'")
        
        soup = BeautifulSoup(html, 'html.parser')
        tables = safe_select(soup, selector)
        
        if not tables:
            logger.warning(f"No table found with selector: '{selector}'")
            return ExtractedTable(selector=selector, confidence=0.0)
        
        table = tables[0]  # Use first matching table
        
        # Extract headers
        headers = []
        header_row = table.find('tr')
        if header_row:
            header_cells = header_row.find_all(['th', 'td'])
            headers = [normalize_text(cell.get_text()) for cell in header_cells]
        
        # Extract rows
        rows = []
        table_rows = table.find_all('tr')[1:]  # Skip header row
        
        for i, row in enumerate(table_rows):
            cells = row.find_all(['td', 'th'])
            cell_texts = [normalize_text(cell.get_text()) for cell in cells]
            
            # Create cell mapping using headers
            cell_mapping = {}
            for j, cell_text in enumerate(cell_texts):
                if j < len(headers):
                    cell_mapping[headers[j]] = cell_text
                else:
                    cell_mapping[f'column_{j}'] = cell_text
            
            table_row = TableRow(
                row_index=i,
                cells=cell_mapping,
                raw_cells=cell_texts
            )
            rows.append(table_row)
        
        confidence = 1.0 if headers and rows else 0.5
        
        logger.info(f"Extracted table with {len(headers)} headers and {len(rows)} rows")
        
        return ExtractedTable(
            selector=selector,
            headers=headers,
            rows=rows,
            confidence=confidence
        )
    
    def _extract_field_from_element(self, element: Tag, base_url: Optional[str] = None, 
                                   selector: str = None) -> Optional[ExtractedField]:
        """Extract field information from a single element."""
        if not element:
            return None
        
        # Get text content
        raw_text = extract_visible_text(element)
        if not raw_text:
            return None
        
        clean_text = normalize_text(raw_text)
        if not clean_text:
            return None
        
        # Get inner HTML
        inner_html = str(element) if len(str(element)) < 1000 else str(element)[:1000] + "..."
        
        # Generate selector if not provided
        if not selector:
            selector = self._generate_selector(element)
        
        # Try to extract price
        price = None
        if is_likely_price_element(element):
            price_result = normalize_price(clean_text, self.currency_hint)
            if price_result.confidence > 0.3:
                price = price_result
        
        # Try to extract date
        date = None
        if is_likely_date_element(element):
            date_result = normalize_date(clean_text, self.locale)
            if date_result.confidence > 0.3:
                date = date_result
        
        # Calculate overall confidence
        confidence = 1.0
        if price and price.confidence < 0.7:
            confidence *= 0.8
        if date and date.confidence < 0.7:
            confidence *= 0.8
        
        return ExtractedField(
            selector=selector,
            raw_text=raw_text,
            clean_text=clean_text,
            inner_html=inner_html,
            price=price,
            date=date,
            confidence=confidence
        )
    
    def _generate_selector(self, element: Tag) -> str:
        """Generate a CSS selector for an element."""
        selectors = []
        
        # Add tag name
        selectors.append(element.name)
        
        # Add ID if present
        if element.get('id'):
            return f"{element.name}#{element.get('id')}"
        
        # Add class if present
        classes = element.get('class', [])
        if classes:
            class_selector = '.' + '.'.join(classes[:2])  # Limit to first 2 classes
            selectors.append(class_selector)
            return f"{element.name}{class_selector}"
        
        return element.name
    
    def _extract_prices_from_text(self, text: str) -> List[PriceNormalized]:
        """Extract prices from plain text."""
        if not text:
            return []
        
        prices = []
        
        # Split text into sentences/blocks
        text_blocks = split_text_blocks(text, min_length=10)
        
        for block in text_blocks:
            price_result = normalize_price(block, self.currency_hint)
            if price_result.confidence > 0.4:  # Only high-confidence prices
                prices.append(price_result)
        
        return prices
    
    def _extract_dates_from_text(self, text: str) -> List[DateNormalized]:
        """Extract dates from plain text."""
        if not text:
            return []
        
        dates = []
        
        # Split text into sentences/blocks
        text_blocks = split_text_blocks(text, min_length=5)
        
        for block in text_blocks:
            date_result = normalize_date(block, self.locale)
            if date_result.confidence > 0.4:  # Only high-confidence dates
                dates.append(date_result)
        
        return dates


# Convenience functions
def parse_html(html: str, base_url: Optional[str] = None, **kwargs) -> ParsedDocument:
    """
    Convenience function to parse HTML.
    
    Args:
        html: HTML content
        base_url: Optional base URL
        **kwargs: Additional parser options
        
    Returns:
        ParsedDocument
    """
    parser = Parser(**kwargs)
    return parser.parse_html(html, base_url)


def extract_by_selector(html: str, selector: str, **kwargs) -> List[ExtractedField]:
    """
    Convenience function to extract by selector.
    
    Args:
        html: HTML content
        selector: CSS selector
        **kwargs: Additional parser options
        
    Returns:
        List of ExtractedField
    """
    parser = Parser(**kwargs)
    return parser.extract_by_selector(html, selector)


def parse_table(html: str, selector: str, **kwargs) -> ExtractedTable:
    """
    Convenience function to parse table.
    
    Args:
        html: HTML content
        selector: CSS selector for table
        **kwargs: Additional parser options
        
    Returns:
        ExtractedTable
    """
    parser = Parser(**kwargs)
    return parser.parse_table(html, selector)