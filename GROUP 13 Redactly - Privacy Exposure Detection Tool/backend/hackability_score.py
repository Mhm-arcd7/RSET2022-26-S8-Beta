# privacy_risk_engine.py

# ===============================
# Constants (from PPT)
# ===============================

ALPHA = 0.6
BETA = 0.4


# ===============================
# Sensitivity values (FROM PDF – LOCKED)
# ===============================

SI_LOOKUP = {
    "Face": 0.8,
    "Fingerprints": 0.8,
    "Full Name": 0.4,
    "Government ID": 0.8,
    "Address": 0.8,
    "Phone Number": 0.7,
    "Email": 0.6,
    "Signature": 0.7,
    "Credit/Debit Card": 0.7,
    "Transaction Details": 0.6,
    "Bills and Payments": 0.6,
    "Medical Reports": 0.8,
    "Private Chat": 0.5,
    "Username": 0.5,
    "Passwords / OTPs": 0.7,
    "Location": 0.7,
    "Landmark": 0.4,
    "License Plate / House No.": 0.7
}


# ===============================
# Core Function (PPT Algorithm ONLY)
# ===============================

def compute_privacy_risk(detected_items, Ci):

    if not detected_items:
        return 0.0

    total_risk = 0.0

    for item in detected_items:
        S = SI_LOOKUP[item["type"]]
        F = item["frequency"]
        T = item["temporal_persistence"]

        L = Ci * (ALPHA * F + BETA * T)
        total_risk += L * S

    normalized = total_risk / len(detected_items)

    return round(min(100, normalized * 100), 2)
# ======================================
# Adapter for Redactly Detection Output
# ======================================

def generate_detected_items_from_pii(pii_data: dict):
    """
    Converts extract_pii() output into
    format required by compute_privacy_risk()
    """

    # 🔁 Map structured + entity types to SI_LOOKUP keys
    mapping = {
        # Structured fields
        "emails": "Email",
        "phones": "Phone Number",
        "pan_numbers": "Government ID",
        "passport_numbers": "Government ID",
        "credit_cards": "Credit/Debit Card",
        "account_numbers": "Transaction Details",
        "ifsc_codes": "Transaction Details",

        # spaCy entities
        "PERSON": "Full Name",
        "GPE": "Location",
        "LOC": "Location",
        "ORG": "Landmark"
    }

    detected_items = []

    # ============================
    # 1️⃣ Structured PII fields
    # ============================
    for key, label in mapping.items():
        if key in pii_data:  # structured keys
            values = pii_data.get(key, [])
            if not values:
                continue

            frequency = min(len(values) / 5.0, 1.0)
            temporal_persistence = 0.9

            detected_items.append({
                "type": label,
                "frequency": frequency,
                "temporal_persistence": temporal_persistence
            })

    # ============================
    # 2️⃣ spaCy Named Entities
    # ============================
    entities = pii_data.get("entities", {})

    for entity_label, values in entities.items():
        if entity_label not in mapping:
            continue

        if not values:
            continue

        mapped_label = mapping[entity_label]

        frequency = min(len(values) / 5.0, 1.0)
        temporal_persistence = 0.9

        detected_items.append({
            "type": mapped_label,
            "frequency": frequency,
            "temporal_persistence": temporal_persistence
        })

    return detected_items