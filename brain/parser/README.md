# NexusAI HTML Parser

A comprehensive HTML parsing and data cleaning package for extracting structured information from web content. Specializes in normalizing prices, dates, and text with internationalization support.

## 🚀 Features

- **Intelligent HTML Parsing**: Extract titles, descriptions, and main content
- **Price Normalization**: Handle various currency formats, ranges, and symbols
- **Date Parsing**: Support for relative dates, multiple formats, and locales  
- **Text Cleaning**: Remove noise, normalize unicode, and clean formatting
- **Table Extraction**: Convert HTML tables to structured data
- **Language Detection**: Automatic language identification (optional)
- **Noise Filtering**: Remove ads, scripts, and boilerplate content
- **Confidence Scoring**: All extractions include confidence metrics

## 📦 Installation

```bash
# Install dependencies
pip install -r brain/parser/requirements.txt

# Optional: Install language detection
pip install langdetect
```

## 🎯 Quick Start

### Basic Usage

```python
from brain.parser import Parser

# Initialize parser
parser = Parser(currency_hint="INR", locale="en-IN")

# Parse HTML content
html = """
<html>
<head><title>Product Page</title></head>
<body>
    <h1>Gaming Laptop</h1>
    <div class="price">₹85,999</div>
    <p class="date">Available since March 15, 2024</p>
</body>
</html>
"""

doc = parser.parse_html(html)

# Access extracted data
print(f"Title: {doc.title}")
print(f"Prices found: {len(doc.prices)}")
print(f"Primary price: {doc.get_primary_price().amount} {doc.get_primary_price().currency}")
```

### Convenience Functions

```python
from brain.parser import parse_html, normalize_price, normalize_date

# Quick parsing
doc = parse_html(html_content, base_url="https://example.com")

# Direct normalization
price = normalize_price("₹45,000 - ₹50,000", currency_hint="INR")
print(f"Price range: {price.min_amount} - {price.max_amount} {price.currency}")

date = normalize_date("2 days ago")
print(f"Parsed date: {date.iso_date}")
```

## 📚 API Reference

### Parser Class

```python
parser = Parser(
    strip_noise=True,      # Remove ads, scripts, boilerplate
    detect_lang=True,      # Detect page language
    currency_hint="USD",   # Default currency for ambiguous prices
    locale="en-US"         # Default locale for date parsing
)
```

#### Core Methods

```python
# Parse complete HTML document
doc = parser.parse_html(html, base_url=None)

# Extract specific elements
fields = parser.extract_by_selector(html, ".price, .cost")

# Parse HTML table
table = parser.parse_table(html, "table.pricing")
```

### ParsedDocument

```python
# Access parsed content
doc.title                    # Page title
doc.meta_description        # Meta description
doc.language               # Detected language
doc.text_blocks           # Main content blocks
doc.extracted_fields      # All extracted fields
doc.prices               # All found prices
doc.dates                # All found dates

# Utility methods
primary_price = doc.get_primary_price()           # Highest confidence price
primary_date = doc.get_primary_date()             # Highest confidence date
inr_prices = doc.get_prices_by_currency("INR")   # Filter by currency
price_range = doc.get_price_range()               # Min/max across all prices
```

### Normalization Functions

#### Price Normalization

```python
from brain.parser.normalizers import normalize_price

# Various formats supported
normalize_price("₹45,000")                    # ₹45,000 → 45000.0 INR
normalize_price("$1,234.56")                  # $1,234.56 → 1234.56 USD  
normalize_price("45000 INR")                  # 45000 INR → 45000.0 INR
normalize_price("₹40,000 - ₹45,000")         # Range → min: 40000, max: 45000
normalize_price("1000-1500 USD")              # Range → min: 1000, max: 1500

# Result structure
price = normalize_price("₹45,000")
price.raw           # "₹45,000"
price.amount        # 45000.0
price.currency      # "INR"
price.confidence    # 0.85
price.min_amount    # None (for ranges)
price.max_amount    # None (for ranges)
```

#### Date Normalization

```python
from brain.parser.normalizers import normalize_date

# Various formats supported
normalize_date("March 15, 2024")              # Standard format
normalize_date("2024-03-15")                  # ISO format
normalize_date("15/03/2024")                  # Numeric format
normalize_date("2 days ago")                  # Relative date
normalize_date("yesterday")                   # Relative keywords

# Result structure
date = normalize_date("March 15, 2024")
date.raw                # "March 15, 2024"
date.iso_date          # "2024-03-15"
date.parsed_datetime   # datetime(2024, 3, 15)
date.confidence        # 0.95
date.partial          # False
```

#### Text Normalization

```python
from brain.parser.normalizers import normalize_text

# Clean and normalize text
normalize_text("  hello   world  ")           # "hello world"
normalize_text("hello\u00a0world")            # "hello world" (non-breaking space)
normalize_text(""smart quotes"")               # '"smart quotes"'
```

### Table Extraction

```python
# Extract HTML table
table = parser.parse_table(html, "table.pricing")

table.headers          # ["Product", "Price", "Availability"]
table.rows            # List of TableRow objects
table.confidence      # Extraction confidence

# Access row data
for row in table.rows:
    print(f"Row {row.row_index}:")
    print(f"  Cells: {row.cells}")           # Dict mapping headers to values
    print(f"  Raw: {row.raw_cells}")         # List of raw cell values
```

## 🛠️ CLI Demo

### Basic Usage

```bash
# Parse local file
python brain/parser/demo_parse.py --file sample.html

# Parse URL
python brain/parser/demo_parse.py --url "https://example.com/product"

# With options
python brain/parser/demo_parse.py \
    --file product.html \
    --output results.json \
    --currency INR \
    --locale en-IN \
    --verbose
```

### Demo Options

```bash
--file PATH              # Local HTML file
--url URL                # URL to fetch and parse
--output FILE            # Output JSON file (default: parsed_output.json)
--currency CODE          # Currency hint (INR, USD, EUR, etc.)
--locale CODE            # Locale hint (en-US, en-IN, etc.)
--no-strip-noise         # Disable noise removal
--no-detect-lang         # Disable language detection
--verbose               # Enable debug logging
--quiet                 # Only show errors
```

### Sample Output

```bash
$ python brain/parser/demo_parse.py --file sample.html --currency INR

============================================================
PARSING SUMMARY
============================================================
Title: Gaming Laptop Pro X1
URL: Not provided
Language: en
Description: Amazing gaming laptop deals starting from ₹45,000. High performance...

Content blocks: 8
Extracted fields: 12
Prices found: 7
Dates found: 2

Top 3 Prices:
  1. INR 89999.00 (confidence: 0.90)
     Raw: '₹89,999'
  2. INR 99999.00 (confidence: 0.85)
     Raw: 'Was: ₹99,999'
  3. INR 100000.00 (confidence: 0.80)
     Raw: '₹75,000 - ₹1,25,000'

Top 3 Dates:
  1. 2024-03-15 (confidence: 0.95)
     Raw: 'Released: March 15, 2024'

✓ Parsing completed successfully!
Results saved to: parsed_output.json
```

## 🌍 Internationalization

### Currency Support

```python
# Supported currencies
currencies = [
    "INR", "USD", "EUR", "GBP", "JPY",  # Codes
    "₹", "$", "€", "£", "¥",            # Symbols
    "rupees", "dollars", "euros"         # Words
]

# Currency hints improve accuracy
parser = Parser(currency_hint="INR")
price = normalize_price("45,000", currency_hint="INR")  # Better accuracy for Indian formats
```

### Date Localization

```python
# Locale affects date parsing
parser = Parser(locale="en-IN")  # Indian English
date = normalize_date("15/03/2024", locale="en-IN")  # DD/MM/YYYY

parser = Parser(locale="en-US")  # US English  
date = normalize_date("03/15/2024", locale="en-US")  # MM/DD/YYYY
```

### Language Detection

```python
# Requires langdetect: pip install langdetect
parser = Parser(detect_lang=True)
doc = parser.parse_html(html)
print(f"Detected language: {doc.language}")  # "en", "hi", "es", etc.
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
python -m pytest brain/parser/tests/ -v

# Run specific test files
python -m pytest brain/parser/tests/test_parser.py -v

# Run with coverage
python -m pytest brain/parser/tests/ --cov=brain.parser --cov-report=html
```

### Test Structure

```
brain/parser/tests/
├── __init__.py
├── test_parser.py          # Main parser tests
└── fixtures/
    └── sample.html         # Test HTML file
```

### Example Test

```python
def test_price_extraction():
    html = '<div class="price">₹45,000</div>'
    parser = Parser(currency_hint="INR")
    doc = parser.parse_html(html)
    
    assert len(doc.prices) >= 1
    price = doc.get_primary_price()
    assert price.amount == 45000.0
    assert price.currency == "INR"
```

## 🔧 Advanced Usage

### Custom Noise Filtering

```python
from brain.parser.utils import strip_html_noise

# Remove noise before parsing
cleaned_html = strip_html_noise(raw_html)
doc = parser.parse_html(cleaned_html)
```

### Batch Processing

```python
# Process multiple HTML documents
documents = []
for html_file in html_files:
    with open(html_file, 'r') as f:
        html = f.read()
    
    doc = parser.parse_html(html, base_url=html_file)
    documents.append(doc)

# Aggregate results
all_prices = []
for doc in documents:
    all_prices.extend(doc.prices)

# Find price trends
inr_prices = [p.amount for p in all_prices if p.currency == "INR"]
avg_price = sum(inr_prices) / len(inr_prices)
```

### Custom Field Extraction

```python
# Extract specific data patterns
fields = parser.extract_by_selector(html, '.product-price, .sale-price, .discount')

for field in fields:
    if field.price:
        print(f"Found price: {field.price.amount} {field.price.currency}")
    
    if field.date:
        print(f"Found date: {field.date.iso_date}")
```

### Error Handling

```python
try:
    doc = parser.parse_html(html)
    
    # Check for parsing issues
    if not doc.prices and "price" in html.lower():
        print("Warning: Expected prices but none found")
    
    if doc.get_primary_price() and doc.get_primary_price().confidence < 0.5:
        print("Warning: Low confidence price extraction")
        
except Exception as e:
    print(f"Parsing failed: {e}")
    # Fallback to basic text extraction
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text()
```

## 📊 Performance Tips

### Optimize for Large Documents

```python
# Disable language detection for speed
parser = Parser(detect_lang=False)

# Process in chunks for very large HTML
def parse_large_html(html, chunk_size=100000):
    if len(html) < chunk_size:
        return parser.parse_html(html)
    
    # Split and process main content sections
    soup = BeautifulSoup(html, 'html.parser')
    main_content = soup.find('main') or soup.find('body')
    
    if main_content:
        return parser.parse_html(str(main_content))
    
    return parser.parse_html(html[:chunk_size])
```

### Batch Currency/Date Processing

```python
# Pre-compile patterns for better performance
from brain.parser.normalizers import normalize_price, normalize_date

# Process many text snippets
price_texts = ["₹45,000", "$1,234", "€999", "£500"]
prices = [normalize_price(text, currency_hint="auto") for text in price_texts]

date_texts = ["March 5, 2024", "2 days ago", "yesterday"]  
dates = [normalize_date(text) for text in date_texts]
```

## 🐛 Troubleshooting

### Common Issues

**"No prices found in obvious price content"**
```python
# Check if noise filtering is too aggressive
parser = Parser(strip_noise=False)
doc = parser.parse_html(html)

# Or try with currency hint
parser = Parser(currency_hint="INR")
doc = parser.parse_html(html)
```

**"Dates not parsing correctly"**
```python
# Try with locale hint
date = normalize_date("15/03/2024", locale="en-IN")  # DD/MM/YYYY

# Check for relative dates
date = normalize_date("2 days ago")
```

**"Language detection errors"**
```bash
# Install optional dependency
pip install langdetect

# Or disable if causing issues
parser = Parser(detect_lang=False)
```

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable verbose logging
parser = Parser()
doc = parser.parse_html(html)  # Will show debug info
```

## 🤝 Integration Examples

### With NexusAI Orchestrator

```python
# Integration with orchestrator tools
from brain.parser import Parser

def extract_tool(html: str, selector: str) -> List[str]:
    """Extract tool for orchestrator."""
    parser = Parser()
    fields = parser.extract_by_selector(html, selector)
    return [field.clean_text for field in fields]

def parse_prices_tool(html: str, currency_hint: str = None) -> List[Dict]:
    """Price extraction tool for orchestrator."""
    parser = Parser(currency_hint=currency_hint)
    doc = parser.parse_html(html)
    return [price.to_dict() for price in doc.prices]
```

### With Web Scraping

```python
import requests
from brain.parser import Parser

def scrape_and_parse(url: str) -> Dict:
    """Scrape URL and extract structured data."""
    response = requests.get(url)
    response.raise_for_status()
    
    parser = Parser(strip_noise=True)
    doc = parser.parse_html(response.text, base_url=url)
    
    return {
        "url": url,
        "title": doc.title,
        "prices": [p.to_dict() for p in doc.prices],
        "dates": [d.to_dict() for d in doc.dates],
        "summary": doc.to_dict()["summary"]
    }
```

## 📄 Dependencies

- **beautifulsoup4**: HTML parsing and manipulation
- **price-parser**: Advanced price extraction
- **python-dateutil**: Flexible date parsing
- **pydantic**: Data validation and serialization
- **requests**: HTTP requests (for demo)
- **langdetect**: Language detection (optional)
- **lxml**: Fast XML/HTML parser (optional but recommended)

## 📜 License

This parser is part of the NexusAI project and follows the same licensing terms.

## 🔗 Related Projects

- [NexusAI Orchestrator](../orchestrator/) - Plan execution engine
- [NexusAI Browser Service](../browser_service/) - Web automation
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - HTML parsing
- [price-parser](https://github.com/scrapinghub/price-parser) - Price extraction