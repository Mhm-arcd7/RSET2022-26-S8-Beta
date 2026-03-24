import re
import spacy

nlp = spacy.load("en_core_web_sm")

PAN_PATTERN = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", re.IGNORECASE)
PASSPORT_PATTERN = re.compile(r"\b[A-Z][0-9]{7}\b", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_PATTERN = re.compile(r"\b\d{10}\b|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b")
CREDIT_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,16}\b")

KNOWN_LOCATIONS = {
    "Texas", "Austin", "Chicago", "Springfield",
    "New York City", "Illinois", "Evergreen"
}


# =====================================================
# 🔧 TRANSCRIPT NORMALIZATION (FIXES WHISPER ISSUES)
# =====================================================

def clean_transcript(text: str):

    # Fix spoken email
    text = text.replace(" at ", "@")
    text = text.replace(" dot ", ".")

    # Remove commas inside numbers (credit card fix)
    text = re.sub(r'(?<=\d),(?=\d)', '', text)

    # Remove hyphens inside alphanumeric tokens (PAN fix)
    text = re.sub(r'(?<=\w)-(?=\w)', '', text)

    # Fix passport like "a 1234567" → "A1234567"
    text = re.sub(r'\b([A-Za-z])\s+(\d{7})\b', r'\1\2', text)

    # Fix PAN like "A B C D E 1234 F" → "ABCDE1234F"
    text = re.sub(r'\b([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\s+(\d{4})\s+([A-Za-z])\b',
                  r'\1\2\3\4\5\6\7', text)

    # Remove extra spaces in email username
    text = re.sub(r'\b([A-Za-z]+)\s+([A-Za-z0-9]+)@', r'\1\2@', text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# =====================================================
# 🔍 PII EXTRACTION
# =====================================================

def extract_pii(text: str):

    text = clean_transcript(text)

    # -----------------------------
    # STRUCTURED DETECTION
    # -----------------------------

    pan_matches = set(PAN_PATTERN.findall(text))
    passport_matches = set(PASSPORT_PATTERN.findall(text))
    email_matches = set(EMAIL_PATTERN.findall(text))
    phone_matches = set(PHONE_PATTERN.findall(text))
    credit_matches = set(CREDIT_PATTERN.findall(text))

    # Clean invalid emails
    email_matches = {
        e for e in email_matches
        if "." in e.split("@")[-1]
    }

    structured_values = (
        pan_matches
        | passport_matches
        | email_matches
        | phone_matches
        | credit_matches
    )

    temp_text = text

    # Remove structured BEFORE spaCy
    for val in structured_values:
        temp_text = temp_text.replace(val, "")

    # Remove stray fragments like me@
    temp_text = re.sub(r"\b\w+@", "", temp_text)

    doc = nlp(temp_text)

    entities = {}

    for ent in doc.ents:
        value = ent.text.strip()
        label = ent.label_

        if len(value) < 3:
            continue

        # Prevent long numeric strings being DATE
        if label == "DATE" and re.fullmatch(r"\d{6,}", value):
            continue

        # Force Illinois 627-04 → GPE
        if value.startswith("Illinois"):
            label = "GPE"

        # Force correct GPE for known places
        if value in KNOWN_LOCATIONS:
            label = "GPE"

        # Prevent numeric IDs as PERSON
        if label == "PERSON" and re.search(r"\d", value):
            continue

        entities.setdefault(label, set()).add(value)

    return {
        "entities": {k: list(v) for k, v in entities.items()},
        "pan_numbers": list(pan_matches),
        "passport_numbers": list(passport_matches),
        "emails": list(email_matches),
        "phones": list(phone_matches),
        "credit_cards": list(credit_matches),
    }