# Recommendation System

*COMPANY*: CODTECH IT SOLUTIONS

*NAME*: PATEL PRIYANSHU BAKULBHAI

*INTERN ID*: CTIS8454

*DOMAIN*: MACHINE LEARNING

*DURATION*: 4 WEEKS

*MENTOR*: NEELA SANTOSH

This folder contains a small, self-contained movie recommendation demo implemented as a static web dashboard. It demonstrates a simple user-based collaborative filtering approach and provides a readable evaluation summary for demonstration purposes.

What the App Shows
- User selector and top-N recommendation list with predicted ratings.
- Evaluation panel showing RMSE, MAE and ranking metrics (precision@K, recall@K, hit rate, coverage).
- Visuals: rating-distribution chart and a user-similarity heatmap to inspect neighbor relationships.

Model Overview
- Builds a user-item matrix from the sample ratings and computes cosine similarity between users.
- Scores unseen items with weighted averages from similar users; evaluation hides a held-out interaction per user for metric computation.

Files
- `index.html`, `styles.css`, `app.js` — static dashboard.
- `TASK-4.ipynb` — notebook reference for the original analysis.

Quick Run
Open the folder in a browser or serve it locally:

```bash
python -m http.server 8000
# then visit http://localhost:8000/TASK-4/
```

Notes
- The demo uses a tiny sample dataset for clarity; metrics are illustrative, not production-grade.
- To extend: add CSV upload, item metadata, or back-end scoring for larger datasets.

Contact
Open an issue for questions or suggestions.

#OUTPUT

<img width="1918" height="898" alt="Image" src="https://github.com/user-attachments/assets/18b3cda4-4ed2-459a-9a41-4b0d320cc96a" />

<img width="1917" height="962" alt="Image" src="https://github.com/user-attachments/assets/71092e25-a3b0-45d7-8319-34d8d59ecb2c" />

<img width="1912" height="992" alt="Image" src="https://github.com/user-attachments/assets/b77fd3f2-7cb8-4a4a-8336-14c439e48167" />

<img width="1918" height="1001" alt="Image" src="https://github.com/user-attachments/assets/4203bad8-0567-484a-b001-7a684b326caa" />
