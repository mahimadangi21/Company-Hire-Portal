#!/usr/bin/env python3
"""
PyMuPDF PDF Text Extractor
Primary extraction engine for ATS Resume Intelligence Engine.
Handles multi-column, designer, and ATS resumes with layout-aware extraction.

Usage: python pdf_extractor.py <pdf_path>
Output: extracted text to stdout
Errors: to stderr with exit code 1
"""

import sys
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf", file=sys.stderr)
    sys.exit(1)


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF using PyMuPDF with layout-aware block sorting.
    Handles multi-column layouts by sorting text blocks by position.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    doc = fitz.open(pdf_path)

    if doc.is_encrypted:
        raise ValueError("PDF is encrypted/password protected")

    pages_text = []

    for page_num in range(len(doc)):
        page = doc[page_num]

        # Extract text blocks sorted by vertical then horizontal position
        # sort=True ensures correct reading order for multi-column layouts
        blocks = page.get_text("blocks", sort=True)

        page_lines = []
        for block in blocks:
            # block format: (x0, y0, x1, y1, text, block_no, block_type)
            # block_type 0 = text, 1 = image
            if block[6] == 0:  # Text block only
                text = block[4].strip()
                if text:
                    page_lines.append(text)

        if page_lines:
            pages_text.append("\n".join(page_lines))

    doc.close()

    if not pages_text:
        raise ValueError("No text content found in PDF")

    return "\n\n".join(pages_text)


def main():
    if len(sys.argv) < 2:
        print("ERROR: No PDF path provided. Usage: python pdf_extractor.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        text = extract_text_from_pdf(pdf_path)
        # Write to stdout — Node.js subprocess reads this
        sys.stdout.write(text)
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
