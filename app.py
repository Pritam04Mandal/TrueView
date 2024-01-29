from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from nltk.sentiment import SentimentIntensityAnalyzer
from tqdm.notebook import tqdm
import pandas as pd
import numpy as np
import pickle

tfidf = TfidfVectorizer(max_features=3000, lowercase=True, analyzer='word',)


from flask import Flask, request, jsonify
app = Flask(__name__)

# TFIDF checks the relevance of word in document, 
# change word to vector, and fast
# Load the TF-IDF vectorizer and scaler
with open('tfidf_vectorizer.pkl', 'rb') as file:
    tfidf = pickle.load(file)

# Load the trained model
with open('finalized_model.sav', 'rb') as file:
    model = pickle.load(file)

def preprocess_text(text):
    processed_text = text.lower()
    return processed_text

def predict_originality(review_content):
    # Preprocess the review
    preprocessed_review = preprocess_text(review_content)

    # Vectorize the review
    X_tfidf = tfidf.transform([preprocessed_review]).toarray()

    # Analyze sentiment of the review content
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = sia.polarity_scores(review_content)
    sentiment_features = np.array([sentiment_scores['neg'], sentiment_scores['neu'], 
                                   sentiment_scores['pos'], sentiment_scores['compound']])

    # Scale the sentiment features
    scaler = StandardScaler()
    sentiment_features_scaled = scaler.fit_transform(sentiment_features.reshape(1, -1))

    # Concatenate TF-IDF features with scaled sentiment features
    combined_features = np.hstack([X_tfidf, sentiment_features_scaled])

    # Making prediction
    prediction_probability = model.predict_proba(combined_features)

    # Assuming class 0 is 'Original' and class 1 is 'Fake'
    originality_score = prediction_probability[0][0] * 100  # Convert to percentage

    return {
        "review_content": review_content,
        "originality_percentage": originality_score
    }

@app.route('/')
def index():
    return 'Hello World'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    reviews = data['reviews']
    originality_result=[]
    for i in range(len(reviews)):
        result = predict_originality(reviews[i])
        originality_result.append(result)
    return jsonify({"prediction":originality_result})

if __name__ == '__main__':
    app.run(debug=True)