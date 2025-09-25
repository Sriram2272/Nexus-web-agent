"""
CLI demo for NexusAI HTML parser.
Demonstrates parsing capabilities with local files or URLs.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Optional

import requests
from requests.exceptions import RequestException

from .parser import Parser
from .schema import ParsedDocument

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_html_from_file(file_path: str) -> str:
    """
    Load HTML content from a local file.
    
    Args:
        file_path: Path to HTML file
        
    Returns:
        HTML content
        
    Raises:
        FileNotFoundError: If file doesn't exist
        IOError: If file can't be read
    """
    path = Path(file_path)
    
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Try with different encoding
        with open(path, 'r', encoding='latin-1') as f:
            return f.read()


def load_html_from_url(url: str, timeout: int = 30) -> str:
    """
    Load HTML content from a URL.
    
    Args:
        url: URL to fetch
        timeout: Request timeout in seconds
        
    Returns:
        HTML content
        
    Raises:
        RequestException: If request fails
    """
    headers = {
        'User-Agent': 'NexusAI-Parser/1.0 (HTML Parser Demo)'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.text
    except RequestException as e:
        raise RequestException(f"Failed to fetch {url}: {e}")


def print_summary(doc: ParsedDocument):
    """
    Print a concise summary of parsed document.
    
    Args:
        doc: Parsed document
    """
    print("\n" + "="*60)
    print("PARSING SUMMARY")
    print("="*60)
    
    print(f"Title: {doc.title or 'Not found'}")
    print(f"URL: {doc.url or 'Not provided'}")
    print(f"Language: {doc.language or 'Not detected'}")
    print(f"Description: {(doc.meta_description or 'Not found')[:100]}{'...' if doc.meta_description and len(doc.meta_description) > 100 else ''}")
    
    print(f"\nContent blocks: {len(doc.text_blocks)}")
    print(f"Extracted fields: {len(doc.extracted_fields)}")
    print(f"Prices found: {len(doc.prices)}")
    print(f"Dates found: {len(doc.dates)}")
    
    # Show top prices
    if doc.prices:
        print("\nTop 3 Prices:")
        sorted_prices = sorted(doc.prices, key=lambda p: p.confidence, reverse=True)
        for i, price in enumerate(sorted_prices[:3], 1):
            amount_str = f"{price.amount:.2f}" if price.amount else "Unknown"
            currency_str = price.currency or "?"
            confidence_str = f"{price.confidence:.2f}"
            print(f"  {i}. {currency_str} {amount_str} (confidence: {confidence_str})")
            print(f"     Raw: '{price.raw}'")
    
    # Show top dates
    if doc.dates:
        print("\nTop 3 Dates:")
        sorted_dates = sorted(doc.dates, key=lambda d: d.confidence, reverse=True)
        for i, date in enumerate(sorted_dates[:3], 1):
            date_str = date.iso_date or "Unknown"
            confidence_str = f"{date.confidence:.2f}"
            partial_str = " (partial)" if date.partial else ""
            print(f"  {i}. {date_str}{partial_str} (confidence: {confidence_str})")
            print(f"     Raw: '{date.raw}'")
    
    # Show first few text blocks
    if doc.text_blocks:
        print(f"\nFirst text block preview:")
        preview = doc.text_blocks[0][:200]
        if len(doc.text_blocks[0]) > 200:
            preview += "..."
        print(f"  {preview}")


def save_results(doc: ParsedDocument, output_file: str):
    """
    Save parsed results to JSON file.
    
    Args:
        doc: Parsed document
        output_file: Output file path
    """
    try:
        output_path = Path(output_file)
        
        # Create directory if it doesn't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert to dictionary and save
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(doc.to_dict(), f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\nResults saved to: {output_path.absolute()}")
        
    except Exception as e:
        logger.error(f"Failed to save results: {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='NexusAI HTML Parser Demo',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --file sample.html
  %(prog)s --url "https://example.com/product" 
  %(prog)s --file data.html --output results.json --currency INR
  %(prog)s --url "https://news.example.com" --locale en-US --no-noise
        """
    )
    
    # Input source (mutually exclusive)
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument(
        '--file',
        help='Path to local HTML file'
    )
    source_group.add_argument(
        '--url',
        help='URL to fetch and parse'
    )
    
    # Output options
    parser.add_argument(
        '--output', '-o',
        default='parsed_output.json',
        help='Output JSON file (default: parsed_output.json)'
    )
    
    # Parser options
    parser.add_argument(
        '--currency',
        help='Currency hint for better price parsing (e.g., INR, USD)'
    )
    parser.add_argument(
        '--locale',
        help='Locale hint for better date parsing (e.g., en-US, en-IN)'
    )
    parser.add_argument(
        '--no-strip-noise',
        action='store_true',
        help='Disable HTML noise removal'
    )
    parser.add_argument(
        '--no-detect-lang',
        action='store_true',
        help='Disable language detection'
    )
    
    # Verbosity
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Only show errors'
    )
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.ERROR)
    
    try:
        # Load HTML content
        if args.file:
            logger.info(f"Loading HTML from file: {args.file}")
            html_content = load_html_from_file(args.file)
            base_url = None
        else:
            logger.info(f"Fetching HTML from URL: {args.url}")
            html_content = load_html_from_url(args.url)
            base_url = args.url
        
        logger.info(f"Loaded HTML content ({len(html_content)} characters)")
        
        # Initialize parser with options
        html_parser = Parser(
            strip_noise=not args.no_strip_noise,
            detect_lang=not args.no_detect_lang,
            currency_hint=args.currency,
            locale=args.locale
        )
        
        # Parse HTML
        logger.info("Parsing HTML content...")
        parsed_doc = html_parser.parse_html(html_content, base_url)
        
        # Display summary
        if not args.quiet:
            print_summary(parsed_doc)
        
        # Save results
        save_results(parsed_doc, args.output)
        
        # Print success message
        if not args.quiet:
            print(f"\n✓ Parsing completed successfully!")
            print(f"  Total fields extracted: {len(parsed_doc.extracted_fields)}")
            print(f"  Prices found: {len(parsed_doc.prices)}")
            print(f"  Dates found: {len(parsed_doc.dates)}")
        
        return 0
        
    except FileNotFoundError as e:
        logger.error(f"File error: {e}")
        return 1
    except RequestException as e:
        logger.error(f"Network error: {e}")
        return 1
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=args.verbose)
        return 1


def demo_with_sample_html():
    """
    Run a quick demo with sample HTML content.
    """
    sample_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Sample Product Page</title>
        <meta name="description" content="Amazing laptop deals starting from ₹45,000">
    </head>
    <body>
        <header>
            <nav>Navigation Menu</nav>
        </header>
        <main>
            <article>
                <h1>Gaming Laptop Pro</h1>
                <div class="price">₹85,999</div>
                <div class="original-price">Was: ₹95,000</div>
                <div class="specs">
                    <ul>
                        <li>Intel i7 Processor</li>
                        <li>16GB RAM</li>
                        <li>1TB SSD</li>
                    </ul>
                </div>
                <div class="availability">
                    <span class="date">Available since March 15, 2024</span>
                </div>
                <div class="reviews">
                    <p>Last updated: 2 days ago</p>
                </div>
                <table class="pricing-table">
                    <tr>
                        <th>Model</th>
                        <th>Price</th>
                        <th>Availability</th>
                    </tr>
                    <tr>
                        <td>Basic</td>
                        <td>₹65,000</td>
                        <td>In Stock</td>
                    </tr>
                    <tr>
                        <td>Pro</td>
                        <td>₹85,999</td>
                        <td>Limited</td>
                    </tr>
                </table>
            </article>
        </main>
        <footer>Copyright 2024</footer>
    </body>
    </html>
    """
    
    print("Running demo with sample HTML...")
    
    parser = Parser(currency_hint="INR")
    doc = parser.parse_html(sample_html)
    
    print_summary(doc)
    
    # Also demo table parsing
    print("\n" + "="*60)
    print("TABLE PARSING DEMO")
    print("="*60)
    
    table = parser.parse_table(sample_html, '.pricing-table')
    print(f"Table headers: {table.headers}")
    print(f"Number of rows: {len(table.rows)}")
    
    for i, row in enumerate(table.rows):
        print(f"Row {i + 1}: {row.cells}")


if __name__ == '__main__':
    if len(sys.argv) == 1:
        # No arguments provided, run demo
        demo_with_sample_html()
    else:
        sys.exit(main())