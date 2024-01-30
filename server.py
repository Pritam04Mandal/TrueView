import pandas as pd
from sklearn.calibration import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from nltk.sentiment import SentimentIntensityAnalyzer
from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
import json
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
# import pickle
import string 
from math import ceil

app = Flask(__name__)



filepath = "review_sentiments_dataset.csv"
df = pd.read_csv(filepath)
df = df.drop(['category'], axis=1)
df['processed_text'] = df['text_'].apply(lambda x: x.lower())
df['review_length'] = df['text_'].apply(lambda x: len(x))
df['punctuation_count'] = df['text_'].apply(lambda x: sum(1 for char in x if char in string.punctuation))
X_text = df['processed_text'].values
X_params = df[['neg','neu','pos','compound','review_length', 'punctuation_count']].values
y = df['label'].values
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y)
X_train_text, X_test_text, X_train_params, X_test_params, y_train, y_test = train_test_split(X_text,X_params, y, test_size=0.2, random_state=42)
tokenizer = tf.keras.preprocessing.text.Tokenizer()
tokenizer.fit_on_texts(X_train_text)
X_train_text_seq = tokenizer.texts_to_sequences(X_train_text)
X_test_text_seq = tokenizer.texts_to_sequences(X_test_text)
X_train_text_pad = tf.keras.preprocessing.sequence.pad_sequences(X_train_text_seq)
X_test_text_pad = tf.keras.preprocessing.sequence.pad_sequences(X_test_text_seq, maxlen=X_train_text_pad.shape[1])

model = tf.keras.models.load_model('multi_input_fake_reviews_model.h5')

def preprocess_text(text):
    processed_text = text.lower()
    return processed_text

def count_punctuation(text):
    punctuation_counts = {punct: 0 for punct in string.punctuation}
    count=0
    for char in text:
        if char in punctuation_counts:
            count += 1
    return count

def predict_originality(review_content):

    preprocessed_review = preprocess_text(review_content)
    text_seq = tokenizer.texts_to_sequences([preprocessed_review])
    text_pad = pad_sequences(text_seq,maxlen=X_train_text_pad.shape[0])

    count_of_punctuation = count_punctuation(review_content)
    length_of_review = len(review_content)
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = sia.polarity_scores(review_content)
    sentiment_features =np.array([sentiment_scores['neg'], sentiment_scores['neu'],
                                   sentiment_scores['pos'], sentiment_scores['compound'],length_of_review, count_of_punctuation])


    sentiment_features_scaled = sentiment_features.reshape(1, -1)


    predictions = model.predict([text_pad, sentiment_features_scaled])


    originality_score = predictions[0] * 100  # Convert to percentage


    print(originality_score[0])

    return {
        "review_content": review_content,
        "originality_percentage": round(originality_score[0])
    }

@app.route('/')
def index():
    return 'Hello World'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    reviews = data['reviews']
    originality_result = []

    for i in range(len(reviews)):
        result = predict_originality(reviews[i])
        originality_result.append(result)

    return jsonify({"prediction": originality_result})

if __name__ == '__main__':
    app.run(debug=True)
