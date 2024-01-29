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

def predict_originality(review_title, review_content):
    # Preprocess the review
    preprocessed_review = preprocess_text(review_title + " " + review_content)

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

    # Make a prediction
    prediction_probability = model.predict_proba(combined_features)

    # Assuming class 0 is 'Original' and class 1 is 'Fake'
    originality_score = prediction_probability[0][0] * 100  # Convert to percentage

    return {
        "review_title": review_title,
        "review_content": review_content,
        "originality_percentage": originality_score
    }

@app.route('/')
def index():
    return 'Hello World'

@app.route('/predict', methods=['POST'])
def predict():
    # new_review_title = "Does the job"
    # new_review_text = "Overall I'm happy with the phone's performance. Love the design, the display is outstanding! Much better camera and love the Dolby Atmos feature. You can clearly feel the difference when the headset is on. I felt like the camera smoothens the skin when taking photos in the direct sunlight and doesn't look natural at all.and yes the macro camera is below average.*Editing the review after 3 months - the phone crashes sometimes especially when taking the pictures in night-time mode, and reboots automatically after 2-3 minutes."
    # result = predict_originality(new_review_title, new_review_text)
    # originality_percentage = result['originality_percentage']
    # return result
    # text = request.form.get('reviewer_name')
    # originality_result=[]
    # for i in text:
    #     result = predict_originality("",i)
    #     originality_result.append(result)
    data = request.get_json()
    users = data['users']
    reviews = data['reviews']
    originality_result=[]
    for i in range(len(reviews)):
        result = predict_originality(users[i],reviews[i])
        originality_result.append(result)
    return jsonify({"prediction":originality_result})

if __name__ == '__main__':
    app.run(debug=True)