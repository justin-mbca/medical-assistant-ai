
from flask import Flask, request, jsonify
from transformers import pipeline
import numpy as np

app = Flask(__name__)
nlp = pipeline("ner", model="emilyalsentzer/Bio_ClinicalBERT", aggregation_strategy="simple")

def convert_to_serializable(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_to_serializable(v) for v in obj]
    return obj

@app.route('/ml-nlp', methods=['POST'])
def ml_nlp():
    data = request.get_json()
    text = data.get('text', '')
    # Emergency keyword detection (traditional NLP)
    emergency_keywords = [
        "chest pain", "sudden vision loss", "shortness of breath", "severe bleeding", "loss of consciousness"
    ]
    if any(kw in text.lower() for kw in emergency_keywords):
        return jsonify({
            "emergency": True,
            "message": "EMERGENCY: Your symptoms may indicate a serious medical condition. Seek immediate medical attention or call emergency services."
        })
    result = nlp(text)
    result = convert_to_serializable(result)
    if not result or (isinstance(result, list) and len(result) == 0):
        return jsonify({
            "cannot_answer": True,
            "message": "Sorry, the medical NLP model could not provide an answer for this question. Please consult a healthcare professional for urgent or unclear issues."
        })
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(port=5001)
