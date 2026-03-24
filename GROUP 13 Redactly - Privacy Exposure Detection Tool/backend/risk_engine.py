def analyze_privacy_risks(transcript_entities, frame_results):
    risks = []

    # -------------------------------
    # 1. Face persistence risk
    # -------------------------------
    face_frames = [
        f for f in frame_results
        if f["analysis"]["content"]["faces"]["count"] > 0
    ]

    if len(face_frames) >= 5:
        risks.append({
            "risk_type": "Biometric Exposure",
            "severity": "HIGH",
            "description": "Faces appear repeatedly across multiple frames",
            "frames": [f["frame"] for f in face_frames],
            "reason": "Persistent facial visibility increases re-identification risk"
        })

    # -------------------------------
    # 2. Spoken personal names
    # -------------------------------
    persons = [
        e["text"] for e in transcript_entities
        if e["type"] == "PERSON"
    ]

    if persons:
        risks.append({
            "risk_type": "Identity Disclosure (Audio)",
            "severity": "MEDIUM",
            "description": f"Personal names spoken: {list(set(persons))}",
            "reason": "Names in audio can be used for identity inference"
        })

    # -------------------------------
    # 3. Organization mentions
    # -------------------------------
    orgs = [
        e["text"] for e in transcript_entities
        if e["type"] == "ORG"
    ]

    if orgs:
        risks.append({
            "risk_type": "Affiliation Disclosure",
            "severity": "LOW",
            "description": f"Organizations mentioned: {list(set(orgs))}",
            "reason": "Reveals institutional or workplace context"
        })

    return risks
