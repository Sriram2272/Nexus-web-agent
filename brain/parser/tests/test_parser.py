"""
Unit tests for NexusAI HTML parser.
"""

import pytest
from datetime import datetime
from pathlib import Path

from brain.parser.parser import Parser, parse_html
from brain.parser.normalizers import normalize_price, normalize_date, normalize_text
from brain.parser.schema import ParsedDocument, ExtractedField, PriceNormalized, DateNormalized
from brain.parser.utils import strip_html_noise, safe_select, extract_main_content
from bs4 import BeautifulSoup


class TestNormalizers:
    """Test normalization functions."""
    
    def test_normalize_text(self):
        """Test text normalization."""
        # Basic cleaning
        assert normalize_text("  hello   world  ") == "hello world"
        assert normalize_text("hello\n\nworld") == "hello world"
        
        # Unicode handling
        assert normalize_text("hello\u00a0world") == "hello world"  # Non-breaking space
        assert normalize_text("hello\u200bworld") == "helloworld"    # Zero-width space
        
        # Quote normalization
        assert normalize_text(""hello"") == '"hello"'
        assert normalize_text("'hello'") == "'hello'"
        
        # Empty/None handling
        assert normalize_text("") == ""
        assert normalize_text(None) == ""
    
    def test_normalize_price_basic(self):
        """Test basic price normalization."""
        # Simple currency symbol + amount
        result = normalize_price("₹45,000")
        assert result.amount == 45000.0
        assert result.currency == "INR"
        assert result.confidence > 0.8
        
        # USD format
        result = normalize_price("$1,234.56")
        assert result.amount == 1234.56
        assert result.currency == "USD"
        
        # Amount + currency code
        result = normalize_price("45000 INR")
        assert result.amount == 45000.0
        assert result.currency == "INR"
    
    def test_normalize_price_ranges(self):
        """Test price range normalization."""
        # Range with same currency
        result = normalize_price("₹40,000 - ₹45,000")
        assert result.min_amount == 40000.0
        assert result.max_amount == 45000.0
        assert result.currency == "INR"
        assert result.amount == 42500.0  # Average
        
        # Range with currency at end
        result = normalize_price("1000 - 1500 USD")
        assert result.min_amount == 1000.0
        assert result.max_amount == 1500.0
        assert result.currency == "USD"
    
    def test_normalize_price_edge_cases(self):
        """Test price normalization edge cases."""
        # No price found
        result = normalize_price("hello world")
        assert result.confidence == 0.0
        assert result.amount is None
        
        # Empty input
        result = normalize_price("")
        assert result.confidence == 0.0
        
        # Just numbers (lower confidence)
        result = normalize_price("12345")
        assert result.amount == 12345.0
        assert result.confidence < 0.7
    
    def test_normalize_date_basic(self):
        """Test basic date normalization."""
        # Standard formats
        result = normalize_date("March 5, 2024")
        assert result.iso_date == "2024-03-05"
        assert result.confidence > 0.9
        
        result = normalize_date("2024-03-05")
        assert result.iso_date == "2024-03-05"
        assert result.confidence > 0.8
        
        result = normalize_date("05/03/2024")
        assert result.parsed_datetime is not None
        assert result.confidence > 0.8
    
    def test_normalize_date_relative(self):
        """Test relative date parsing."""
        # Relative dates (approximate tests)
        result = normalize_date("2 days ago")
        assert result.parsed_datetime is not None
        assert result.confidence > 0.8
        
        result = normalize_date("yesterday")
        assert result.parsed_datetime is not None
        assert result.confidence > 0.8
        
        result = normalize_date("today")
        assert result.parsed_datetime is not None
        assert result.confidence > 0.8
    
    def test_normalize_date_edge_cases(self):
        """Test date normalization edge cases."""
        # No date found
        result = normalize_date("hello world")
        assert result.confidence == 0.0
        
        # Empty input
        result = normalize_date("")
        assert result.confidence == 0.0
        
        # Partial dates
        result = normalize_date("2024")
        if result.confidence > 0:  # May or may not parse
            assert result.partial is True


class TestUtils:
    """Test utility functions."""
    
    def test_strip_html_noise(self):
        """Test HTML noise removal."""
        html = """
        <html>
        <head><title>Test</title></head>
        <body>
            <script>alert('noise');</script>
            <style>.test{color:red;}</style>
            <div class="content">Main content here</div>
            <div class="advertisement">Buy now!</div>
            <footer>Copyright 2024</footer>
        </body>
        </html>
        """
        
        cleaned = strip_html_noise(html)
        assert "<script>" not in cleaned
        assert "<style>" not in cleaned
        assert "advertisement" not in cleaned.lower()
        assert "Main content here" in cleaned
    
    def test_safe_select(self):
        """Test safe CSS selector."""
        html = "<div class='test'>Content</div>"
        soup = BeautifulSoup(html, 'html.parser')
        
        # Valid selector
        results = safe_select(soup, ".test")
        assert len(results) == 1
        assert results[0].get_text() == "Content"
        
        # Invalid selector (should not raise exception)
        results = safe_select(soup, "invalid::selector")
        assert results == []
    
    def test_extract_main_content(self):
        """Test main content extraction."""
        html = """
        <html>
        <body>
            <nav>Navigation</nav>
            <main>
                <p>This is main content.</p>
                <p>Another paragraph.</p>
            </main>
            <aside>Sidebar content</aside>
        </body>
        </html>
        """
        
        soup = BeautifulSoup(html, 'html.parser')
        content_blocks = extract_main_content(soup)
        
        assert len(content_blocks) >= 1
        assert any("main content" in block for block in content_blocks)


class TestParser:
    """Test main Parser class."""
    
    @pytest.fixture
    def sample_html(self):
        """Sample HTML for testing."""
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Test Product Page</title>
            <meta name="description" content="Great laptop deals from ₹50,000">
        </head>
        <body>
            <main>
                <h1>Gaming Laptop</h1>
                <div class="price">₹75,000</div>
                <div class="old-price">Was: ₹85,000</div>
                <p class="description">High-performance gaming laptop with excellent features.</p>
                <div class="availability">
                    <span class="date">Available since March 1, 2024</span>
                </div>
                <table class="specs">
                    <tr><th>Component</th><th>Specification</th></tr>
                    <tr><td>CPU</td><td>Intel i7</td></tr>
                    <tr><td>RAM</td><td>16GB</td></tr>
                </table>
            </main>
        </body>
        </html>
        """
    
    def test_parser_initialization(self):
        """Test parser initialization."""
        parser = Parser()
        assert parser.strip_noise is True
        assert parser.detect_lang is True
        
        parser = Parser(strip_noise=False, currency_hint="USD")
        assert parser.strip_noise is False
        assert parser.currency_hint == "USD"
    
    def test_parse_html_basic(self, sample_html):
        """Test basic HTML parsing."""
        parser = Parser(currency_hint="INR")
        doc = parser.parse_html(sample_html)
        
        assert isinstance(doc, ParsedDocument)
        assert doc.title == "Test Product Page"
        assert "laptop deals" in doc.meta_description
        assert len(doc.text_blocks) > 0
        assert "gaming laptop" in doc.text_blocks[0].lower()
    
    def test_parse_html_prices(self, sample_html):
        """Test price extraction from HTML."""
        parser = Parser(currency_hint="INR")
        doc = parser.parse_html(sample_html)
        
        # Should find prices
        assert len(doc.prices) >= 2  # At least ₹75,000 and ₹85,000
        
        # Check primary price
        primary_price = doc.get_primary_price()
        assert primary_price is not None
        assert primary_price.currency == "INR"
        assert primary_price.amount in [75000.0, 85000.0]
    
    def test_parse_html_dates(self, sample_html):
        """Test date extraction from HTML."""
        parser = Parser()
        doc = parser.parse_html(sample_html)
        
        # Should find the "March 1, 2024" date
        assert len(doc.dates) >= 1
        
        primary_date = doc.get_primary_date()
        assert primary_date is not None
        assert "2024-03-01" in primary_date.iso_date
    
    def test_extract_by_selector(self, sample_html):
        """Test extraction by CSS selector."""
        parser = Parser()
        fields = parser.extract_by_selector(sample_html, ".price")
        
        assert len(fields) >= 1
        price_field = fields[0]
        assert "75,000" in price_field.raw_text
        assert price_field.price is not None
        assert price_field.price.amount == 75000.0
    
    def test_parse_table(self, sample_html):
        """Test table parsing."""
        parser = Parser()
        table = parser.parse_table(sample_html, ".specs")
        
        assert len(table.headers) == 2
        assert "Component" in table.headers
        assert "Specification" in table.headers
        
        assert len(table.rows) >= 2
        
        # Check first row
        first_row = table.rows[0]
        assert "CPU" in first_row.cells.values()
        assert "Intel i7" in first_row.cells.values()
    
    def test_empty_html(self):
        """Test handling of empty HTML."""
        parser = Parser()
        doc = parser.parse_html("")
        
        assert isinstance(doc, ParsedDocument)
        assert doc.title is None
        assert len(doc.extracted_fields) == 0
        assert len(doc.prices) == 0
        assert len(doc.dates) == 0
    
    def test_parse_html_with_base_url(self, sample_html):
        """Test parsing with base URL."""
        parser = Parser()
        base_url = "https://example.com/product"
        doc = parser.parse_html(sample_html, base_url)
        
        assert doc.url == base_url


class TestConvenienceFunctions:
    """Test convenience functions."""
    
    def test_parse_html_function(self):
        """Test parse_html convenience function."""
        html = "<html><head><title>Test</title></head><body><p>Content</p></body></html>"
        doc = parse_html(html)
        
        assert isinstance(doc, ParsedDocument)
        assert doc.title == "Test"


class TestSchemaModels:
    """Test Pydantic schema models."""
    
    def test_price_normalized_validation(self):
        """Test PriceNormalized model validation."""
        # Valid price
        price = PriceNormalized(
            raw="₹45,000",
            amount=45000.0,
            currency="INR",
            confidence=0.9
        )
        assert price.raw == "₹45,000"
        assert price.amount == 45000.0
        assert price.confidence == 0.9
        
        # Confidence validation
        price = PriceNormalized(raw="test", confidence=1.5)
        assert price.confidence == 1.0  # Should be clamped
        
        price = PriceNormalized(raw="test", confidence=-0.1)
        assert price.confidence == 0.0  # Should be clamped
    
    def test_date_normalized_validation(self):
        """Test DateNormalized model validation."""
        date = DateNormalized(
            raw="March 5, 2024",
            iso_date="2024-03-05",
            parsed_datetime=datetime(2024, 3, 5),
            confidence=0.95
        )
        assert date.raw == "March 5, 2024"
        assert date.iso_date == "2024-03-05"
        assert date.confidence == 0.95
    
    def test_extracted_field_validation(self):
        """Test ExtractedField model validation."""
        field = ExtractedField(
            selector=".price",
            raw_text="₹45,000",
            clean_text="₹45,000"
        )
        assert field.selector == ".price"
        assert field.confidence == 1.0  # Default value
    
    def test_parsed_document_methods(self):
        """Test ParsedDocument utility methods."""
        # Create sample prices
        price1 = PriceNormalized(raw="₹100", amount=100.0, currency="INR", confidence=0.8)
        price2 = PriceNormalized(raw="₹200", amount=200.0, currency="INR", confidence=0.9)
        price3 = PriceNormalized(raw="$50", amount=50.0, currency="USD", confidence=0.7)
        
        doc = ParsedDocument(
            title="Test",
            prices=[price1, price2, price3]
        )
        
        # Test primary price (highest confidence)
        primary = doc.get_primary_price()
        assert primary.amount == 200.0
        assert primary.confidence == 0.9
        
        # Test prices by currency
        inr_prices = doc.get_prices_by_currency("INR")
        assert len(inr_prices) == 2
        
        usd_prices = doc.get_prices_by_currency("USD")
        assert len(usd_prices) == 1
        
        # Test price range
        price_range = doc.get_price_range()
        assert price_range["min_price"] == 50.0
        assert price_range["max_price"] == 200.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])