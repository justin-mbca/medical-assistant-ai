from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)
nlp = pipeline("ner", model="emilyalsentzer/Bio_ClinicalBERT", aggregation_strategy="simple")

@app.route('/ml-nlp', methods=['POST'])
def ml_nlp():
    data = request.get_json()
    text = data.get('text', '')
    result = nlp(text)
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(port=5001)
