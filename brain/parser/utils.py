"""
Utility functions for NexusAI HTML parser.
"""

import logging
import re
from typing import List, Optional
from bs4 import BeautifulSoup, Tag, NavigableString

logger = logging.getLogger(__name__)

# Common noise elements to remove
NOISE_SELECTORS = [
    'script',
    'style', 
    'noscript',
    'iframe',
    'object',
    'embed',
    'form',
    '.advertisement',
    '.ad',
    '.ads',
    '.banner',
    '.popup',
    '.modal',
    '.cookie',
    '.newsletter',
    '.subscription',
    '.social-share',
    '.social-media',
    '.sidebar',
    '.related-articles',
    '.comments',
    '.comment',
    '.footer',
    'header.site-header',
    'nav',
    '.navigation',
    '.breadcrumb',
    '.breadcrumbs',
    '.tags',
    '.tag-list',
    '.metadata',
    '.author-info',
    '.share-buttons'
]

# Common boilerplate text patterns
NOISE_TEXT_PATTERNS = [
    r'cookie policy',
    r'privacy policy', 
    r'terms of service',
    r'subscribe to.*newsletter',
    r'follow us on',
    r'share this',
    r'like us on facebook',
    r'tweet this',
    r'pin it',
    r'copyright \d{4}',
    r'all rights reserved',
    r'powered by',
    r'website by',
    r'designed by',
    r'click here to',
    r'read more',
    r'continue reading',
    r'load more',
    r'show more',
    r'view all',
    r'see all',
    r'advertisement',
    r'sponsored content',
    r'promoted'
]


def strip_html_noise(html: str) -> str:
    """
    Remove common noise elements from HTML.
    
    Args:
        html: Raw HTML content
        
    Returns:
        Cleaned HTML with noise elements removed
    """
    if not html:
        return html
    
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove noise elements
        for selector in NOISE_SELECTORS:
            for element in soup.select(selector):
                element.decompose()
        
        # Remove elements with noise text patterns
        for element in soup.find_all(text=True):
            if isinstance(element, NavigableString):
                text = element.get_text().lower().strip()
                for pattern in NOISE_TEXT_PATTERNS:
                    if re.search(pattern, text, re.IGNORECASE):
                        parent = element.parent
                        if parent:
                            parent.decompose()
                        break
        
        # Remove empty elements
        for element in soup.find_all():
            if not element.get_text(strip=True) and not element.find('img'):
                element.decompose()
        
        return str(soup)
        
    except Exception as e:
        logger.warning(f"Failed to strip HTML noise: {e}")
        return html


def safe_select(soup: BeautifulSoup, selector: str) -> List[Tag]:
    """
    Safely select elements with CSS selector, returning empty list on error.
    
    Args:
        soup: BeautifulSoup object
        selector: CSS selector
        
    Returns:
        List of matching elements, empty list if selector invalid
    """
    try:
        return soup.select(selector)
    except Exception as e:
        logger.debug(f"Invalid CSS selector '{selector}': {e}")
        return []


def extract_visible_text(element: Tag) -> str:
    """
    Extract visible text from an HTML element, excluding hidden content.
    
    Args:
        element: BeautifulSoup Tag element
        
    Returns:
        Visible text content
    """
    if not element:
        return ""
    
    # Skip elements that are likely hidden
    style = element.get('style', '')
    if 'display:none' in style.replace(' ', '') or 'visibility:hidden' in style.replace(' ', ''):
        return ""
    
    # Check for hidden class names
    classes = element.get('class', [])
    hidden_classes = ['hidden', 'invisible', 'sr-only', 'd-none', 'hide']
    if any(cls in classes for cls in hidden_classes):
        return ""
    
    # Get text content
    text = element.get_text(separator=' ', strip=True)
    return text


def clean_text_content(text: str) -> str:
    """
    Clean extracted text content.
    
    Args:
        text: Raw text content
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Remove common noise patterns
    for pattern in NOISE_TEXT_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Remove repeated punctuation
    text = re.sub(r'[.]{3,}', '...', text)
    text = re.sub(r'[-]{2,}', '--', text)
    text = re.sub(r'[_]{2,}', '__', text)
    
    return text.strip()


def extract_main_content(soup: BeautifulSoup) -> List[str]:
    """
    Extract main content blocks from HTML, filtering out navigation and boilerplate.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        List of main content text blocks
    """
    content_blocks = []
    
    # Priority selectors for main content
    main_content_selectors = [
        'main',
        'article',
        '.main-content',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '#content',
        '#main',
        '.container .content',
        'div[role="main"]'
    ]
    
    # Try to find main content areas
    main_elements = []
    for selector in main_content_selectors:
        elements = safe_select(soup, selector)
        if elements:
            main_elements.extend(elements)
            break  # Use first successful selector
    
    # If no main content found, fall back to body
    if not main_elements:
        body = soup.find('body')
        if body:
            main_elements = [body]
    
    # Extract text from main elements
    for element in main_elements:
        # Look for paragraph-like content
        paragraphs = element.find_all(['p', 'div', 'section', 'article'])
        
        for para in paragraphs:
            text = extract_visible_text(para)
            if text and len(text.strip()) > 20:  # Only substantial content
                cleaned_text = clean_text_content(text)
                if cleaned_text and cleaned_text not in content_blocks:
                    content_blocks.append(cleaned_text)
    
    # If no paragraphs found, get direct text
    if not content_blocks:
        for element in main_elements:
            text = extract_visible_text(element)
            if text:
                cleaned_text = clean_text_content(text)
                if cleaned_text:
                    content_blocks.append(cleaned_text)
    
    return content_blocks


def detect_language(text: str) -> Optional[str]:
    """
    Detect language of text content (optional feature).
    
    Args:
        text: Text to analyze
        
    Returns:
        Language code or None if detection fails
    """
    try:
        from langdetect import detect
        return detect(text)
    except ImportError:
        logger.debug("langdetect not available, skipping language detection")
        return None
    except Exception as e:
        logger.debug(f"Language detection failed: {e}")
        return None


def extract_meta_tags(soup: BeautifulSoup) -> dict:
    """
    Extract common meta tags from HTML head.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        Dictionary of meta tag information
    """
    meta_info = {}
    
    # Title
    title_tag = soup.find('title')
    if title_tag:
        meta_info['title'] = title_tag.get_text().strip()
    
    # Meta description
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    if desc_tag:
        meta_info['description'] = desc_tag.get('content', '').strip()
    
    # Open Graph tags
    og_title = soup.find('meta', attrs={'property': 'og:title'})
    if og_title:
        meta_info['og_title'] = og_title.get('content', '').strip()
    
    og_desc = soup.find('meta', attrs={'property': 'og:description'})
    if og_desc:
        meta_info['og_description'] = og_desc.get('content', '').strip()
    
    # Twitter card tags
    twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
    if twitter_title:
        meta_info['twitter_title'] = twitter_title.get('content', '').strip()
    
    # Keywords
    keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
    if keywords_tag:
        meta_info['keywords'] = keywords_tag.get('content', '').strip()
    
    # Author
    author_tag = soup.find('meta', attrs={'name': 'author'})
    if author_tag:
        meta_info['author'] = author_tag.get('content', '').strip()
    
    # Language
    lang_attr = soup.find('html', attrs={'lang': True})
    if lang_attr:
        meta_info['lang'] = lang_attr.get('lang', '').strip()
    
    return meta_info


def is_likely_price_element(element: Tag) -> bool:
    """
    Check if an element is likely to contain price information.
    
    Args:
        element: BeautifulSoup Tag element
        
    Returns:
        True if element likely contains price
    """
    if not element:
        return False
    
    # Check class names
    classes = ' '.join(element.get('class', [])).lower()
    price_classes = ['price', 'cost', 'amount', 'money', 'currency', 'value']
    if any(cls in classes for cls in price_classes):
        return True
    
    # Check element ID
    element_id = element.get('id', '').lower()
    if any(cls in element_id for cls in price_classes):
        return True
    
    # Check text content for currency symbols
    text = element.get_text()
    currency_symbols = ['$', '€', '£', '¥', '₹', 'USD', 'EUR', 'GBP', 'INR']
    if any(symbol in text for symbol in currency_symbols):
        return True
    
    return False


def is_likely_date_element(element: Tag) -> bool:
    """
    Check if an element is likely to contain date information.
    
    Args:
        element: BeautifulSoup Tag element
        
    Returns:
        True if element likely contains date
    """
    if not element:
        return False
    
    # Check class names
    classes = ' '.join(element.get('class', [])).lower()
    date_classes = ['date', 'time', 'published', 'created', 'updated', 'modified']
    if any(cls in classes for cls in date_classes):
        return True
    
    # Check element ID
    element_id = element.get('id', '').lower()
    if any(cls in element_id for cls in date_classes):
        return True
    
    # Check for datetime attribute
    if element.get('datetime'):
        return True
    
    # Check text content for date patterns
    text = element.get_text()
    date_patterns = [
        r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',  # MM/DD/YYYY
        r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY/MM/DD  
        r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)',  # Month names
        r'\d{1,2}\s+(days?|weeks?|months?|years?)\s+ago'  # Relative dates
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    return False


def split_text_blocks(text: str, min_length: int = 50) -> List[str]:
    """
    Split text into meaningful blocks.
    
    Args:
        text: Input text
        min_length: Minimum length for a text block
        
    Returns:
        List of text blocks
    """
    if not text:
        return []
    
    # Split by double newlines (paragraphs)
    blocks = text.split('\n\n')
    
    # Filter and clean blocks
    result_blocks = []
    for block in blocks:
        cleaned_block = clean_text_content(block)
        if len(cleaned_block) >= min_length:
            result_blocks.append(cleaned_block)
    
    # If no good blocks found, try single newlines
    if not result_blocks:
        blocks = text.split('\n')
        for block in blocks:
            cleaned_block = clean_text_content(block)
            if len(cleaned_block) >= min_length:
                result_blocks.append(cleaned_block)
    
    return result_blocks