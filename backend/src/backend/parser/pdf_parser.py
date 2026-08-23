import pymupdf as fitz

def get_pdf_text(pdf_path:str):
    doc = fitz.open(pdf_path)
    text = ""

    for page in doc:
        text+=page.get_text()
    return text