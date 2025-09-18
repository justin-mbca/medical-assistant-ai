import requests

print("Interactive Medical NLP Chatbot (Ctrl+C to exit)")
while True:
    question = input("Enter your medical question: ")
    if not question.strip():
        continue
    # Emergency keyword detection (traditional NLP)
    emergency_keywords = [
        "chest pain", "sudden vision loss", "shortness of breath", "severe bleeding", "loss of consciousness"
    ]
    if any(kw in question.lower() for kw in emergency_keywords):
        print("EMERGENCY: Your symptoms may indicate a serious medical condition. Seek immediate medical attention or call emergency services.")
        continue
    try:
        response = requests.post("http://localhost:5001/ml-nlp", json={"text": question})
        data = response.json()
        if "result" in data and isinstance(data["result"], list) and data["result"]:
            print("Extracted Entities:")
            for ent in data["result"]:
                print(f"- {ent.get('word','')} (Type: {ent.get('entity_group','')}, Score: {ent.get('score',''):.2f})")
        elif "cannot_answer" in data:
            print(data.get("message", "Sorry, the NLP model could not provide an answer."))
        else:
            print("No entities found or unknown response.")
    except Exception as e:
        print("Error communicating with NLP backend:", e)
