import re
import spacy
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Download NLTK data if not already present
nltk.download('stopwords', quiet=True)

nlp = spacy.load("en_core_web_sm")
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

# Example: Spelling correction (simple)
def correct_spelling(text):
    # For demo, just lower-case and fix common typo
    corrections = {'feverr': 'fever', 'diabtes': 'diabetes'}
    words = text.split()
    return ' '.join([corrections.get(w, w) for w in words])

# Example: Stopword removal
def remove_stopwords(text):
    return ' '.join([w for w in text.split() if w.lower() not in stop_words])

# Example: Stemming
def stem_text(text):
    return ' '.join([stemmer.stem(w) for w in text.split()])

# Example: Lemmatization
def lemmatize_text(text):
    doc = nlp(text)
    return ' '.join([token.lemma_ for token in doc])

# Example: Pattern extraction (lab values)
def extract_lab_values(text):
    pattern = r'(creatinine|hemoglobin)\s*[:\-]?\s*(\d+\.?\d*)'
    return re.findall(pattern, text, re.IGNORECASE)

# Example: Section detection
def detect_sections(text):
    sections = re.findall(r'(History|Assessment|Plan)\s*:', text)
    return sections

if __name__ == "__main__":
    sample = "Patient has feverr and diabtes. Creatinine: 1.2 Hemoglobin: 13. History: ... Assessment: ... Plan: ..."
    print("Original:", sample)
    print("Spelling corrected:", correct_spelling(sample))
    print("Stopwords removed:", remove_stopwords(sample))
    print("Stemmed:", stem_text(sample))
    print("Lemmatized:", lemmatize_text(sample))
    print("Lab values extracted:", extract_lab_values(sample))
    print("Sections detected:", detect_sections(sample))
