from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Sample review text
review_text = "The monitor displays great color accuracy. Best for gaming because of 240hz. The inbuilt modes for changing displays from fps to srgb to dynamic contrast. I have compared other brands and found this is best value for money. 1080p For 25 inch is enough as there is no visible pixels."

# Create TF-IDF vectorizer with appropriate parameters
tfidf = TfidfVectorizer(max_features=3000, lowercase=True, analyzer='word')

# Fit and transform the review text using TF-IDF vectorizer
X_tfidf = tfidf.fit_transform([review_text])

# Convert TF-IDF sparse matrix to a dense array
X_tfidf_array = X_tfidf.toarray()

# Check the shape of the TF-IDF array
print("TF-IDF array shape:", X_tfidf_array.shape)
