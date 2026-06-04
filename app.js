const ratings = [
  { userId: 1, movie: "Avengers", rating: 5 },
  { userId: 1, movie: "Titanic", rating: 4 },
  { userId: 1, movie: "Avatar", rating: 5 },
  { userId: 2, movie: "Avengers", rating: 4 },
  { userId: 2, movie: "Avatar", rating: 5 },
  { userId: 2, movie: "Joker", rating: 3 },
  { userId: 3, movie: "Titanic", rating: 5 },
  { userId: 3, movie: "Avatar", rating: 4 },
  { userId: 3, movie: "Joker", rating: 4 },
  { userId: 4, movie: "Avengers", rating: 3 },
  { userId: 4, movie: "Joker", rating: 5 },
  { userId: 5, movie: "Titanic", rating: 4 },
  { userId: 5, movie: "Avatar", rating: 5 },
  { userId: 5, movie: "Joker", rating: 5 },
];

const movies = [...new Set(ratings.map((entry) => entry.movie))];
const users = [...new Set(ratings.map((entry) => entry.userId))].sort((a, b) => a - b);
const maxRating = 5;

const userSelect = document.getElementById("userSelect");
const topNRange = document.getElementById("topNRange");
const topNLabel = document.getElementById("topNLabel");
const recommendationList = document.getElementById("recommendationList");
const profileList = document.getElementById("profileList");
const metricGrid = document.getElementById("metricGrid");
const ratingChart = document.getElementById("ratingChart");
const heatmap = document.getElementById("heatmap");
const heroStats = document.getElementById("heroStats");
const selectedUserChip = document.getElementById("selectedUserChip");

const holdoutIndexByUser = new Map();
ratings.forEach((entry, index) => {
  holdoutIndexByUser.set(entry.userId, index);
});

const trainRatings = ratings.filter((entry, index) => holdoutIndexByUser.get(entry.userId) !== index);
const testRatings = ratings.filter((entry, index) => holdoutIndexByUser.get(entry.userId) === index);

const fullMatrix = buildMatrix(ratings);
const trainMatrix = buildMatrix(trainRatings);
const globalMean = average(trainRatings.map((entry) => entry.rating));
const userMeans = buildUserMeans(trainRatings);
const similarityMatrix = buildSimilarityMatrix(trainMatrix);
const evaluation = evaluateModel(3);

initControls();
renderDashboard();

userSelect.addEventListener("change", renderDashboard);
topNRange.addEventListener("input", () => {
  topNLabel.textContent = topNRange.value;
  renderDashboard();
});

function initControls() {
  userSelect.innerHTML = users
    .map((userId) => `<option value="${userId}">User ${userId}</option>`)
    .join("");
  userSelect.value = "4";
  topNLabel.textContent = topNRange.value;
}

function renderDashboard() {
  const selectedUserId = Number(userSelect.value);
  const topN = Number(topNRange.value);
  const recommendations = recommendMovies(selectedUserId, topN);

  renderHeroStats();
  renderRecommendations(selectedUserId, recommendations);
  renderProfile(selectedUserId);
  renderMetrics(topN);
  renderRatingChart();
  renderHeatmap();
  selectedUserChip.textContent = `User ${selectedUserId} in focus`;
}

function renderHeroStats() {
  const sparsity = 1 - ratings.length / (users.length * movies.length);
  const averageRating = average(ratings.map((entry) => entry.rating));
  const coverage = evaluation.coverage;

  heroStats.innerHTML = [
    {
      label: "Users",
      value: users.length,
      subvalue: `${trainRatings.length} training interactions`,
    },
    {
      label: "Movies",
      value: movies.length,
      subvalue: `${Math.round(sparsity * 100)}% matrix sparsity`,
    },
    {
      label: "Average rating",
      value: averageRating.toFixed(2),
      subvalue: `${coverage.toFixed(0)}% recommendation coverage`,
    },
  ]
    .map(
      (stat) => `
        <div class="hero-stat">
          <span class="label">${stat.label}</span>
          <div class="value">${stat.value}</div>
          <div class="subvalue">${stat.subvalue}</div>
        </div>
      `,
    )
    .join("");
}

function renderRecommendations(userId, recommendations) {
  if (!recommendations.length) {
    recommendationList.innerHTML = `
      <div class="recommendation-card">
        <span class="rank-badge">No unseen items</span>
        <h3>All titles already rated</h3>
        <p>The selected user has rated every movie in the current sample set.</p>
      </div>
    `;
    return;
  }

  recommendationList.innerHTML = recommendations
    .map((entry, index) => {
      const explanation = buildExplanation(userId, entry.movie);
      const scorePercent = Math.min(100, Math.max(0, (entry.score / maxRating) * 100));

      return `
        <article class="recommendation-card">
          <span class="rank-badge">#${index + 1} Recommendation</span>
          <h3>${entry.movie}</h3>
          <p>Predicted rating: <strong>${entry.score.toFixed(2)}</strong> out of ${maxRating}</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="width:${scorePercent}%"></div>
          </div>
          <div class="meta-row">
            ${explanation.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProfile(userId) {
  const ratedMovies = trainRatings.filter((entry) => entry.userId === userId);
  const hiddenMovie = testRatings.find((entry) => entry.userId === userId);

  profileList.innerHTML = [
    ...ratedMovies.map(
      (entry) => `
        <article class="profile-card">
          <h3>${entry.movie}</h3>
          <p>Observed rating in the training slice.</p>
          <div class="profile-rating">Rated ${entry.rating} / ${maxRating}</div>
        </article>
      `,
    ),
    hiddenMovie
      ? `
        <article class="profile-card">
          <h3>Hidden evaluation item</h3>
          <p>This rating was held out to measure recommendation quality.</p>
          <div class="profile-rating">${hiddenMovie.movie} · Actual rating ${hiddenMovie.rating}</div>
        </article>
      `
      : "",
  ]
    .filter(Boolean)
    .join("");
}

function renderMetrics(topN) {
  const precisionAtK = evaluateAtK(topN).precision;
  const recallAtK = evaluateAtK(topN).recall;

  const metrics = [
    {
      label: "RMSE",
      value: evaluation.rmse.toFixed(2),
      note: "Prediction error on the held-out ratings",
    },
    {
      label: "MAE",
      value: evaluation.mae.toFixed(2),
      note: "Average absolute deviation from actual ratings",
    },
    {
      label: `Precision@${topN}`,
      value: precisionAtK.toFixed(2),
      note: "Share of recommended titles that were relevant",
    },
    {
      label: `Recall@${topN}`,
      value: recallAtK.toFixed(2),
      note: "Share of relevant titles recovered in the shortlist",
    },
    {
      label: "Hit rate@3",
      value: evaluation.hitRate.toFixed(2),
      note: "Whether the hidden item appears in the top three",
    },
    {
      label: "Coverage",
      value: `${evaluation.coverage.toFixed(0)}%`,
      note: "Unique recommended items across all users",
    },
  ];

  metricGrid.innerHTML = metrics
    .map(
      (metric) => `
        <div class="metric-card">
          <h3>${metric.label}</h3>
          <div class="value">${metric.value}</div>
          <p class="note">${metric.note}</p>
        </div>
      `,
    )
    .join("");
}

function renderRatingChart() {
  const counts = new Map();
  [1, 2, 3, 4, 5].forEach((rating) => counts.set(rating, 0));
  ratings.forEach((entry) => counts.set(entry.rating, counts.get(entry.rating) + 1));
  const maxCount = Math.max(...counts.values());

  ratingChart.innerHTML = [...counts.entries()]
    .reverse()
    .map(
      ([rating, count]) => `
        <div class="chart-row">
          <strong>${rating}</strong>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(count / maxCount) * 100}%"></div>
          </div>
          <span>${count}</span>
        </div>
      `,
    )
    .join("");
}

function renderHeatmap() {
  const headerRow = ["", ...users.map((userId) => `U${userId}`)]
    .map((value) => `<div class="heatmap-head">${value}</div>`)
    .join("");

  const bodyRows = users
    .map((rowUserId) => {
      const rowCells = users
        .map((colUserId) => {
          const similarity = similarityMatrix[rowUserId][colUserId];
          const shade = heatColor(similarity);
          return `
            <div class="heatmap-cell" style="background:${shade};">
              ${rowUserId === colUserId ? "1.00" : similarity.toFixed(2)}
            </div>
          `;
        })
        .join("");

      return `
        <div class="heatmap-grid">
          <div class="heatmap-head heatmap-label">U${rowUserId}</div>
          ${rowCells}
        </div>
      `;
    })
    .join("");

  heatmap.innerHTML = `
    <div class="heatmap-grid">${headerRow}</div>
    ${bodyRows}
  `;
}

function buildMatrix(sourceRatings) {
  const matrix = {};

  users.forEach((userId) => {
    matrix[userId] = {};
    movies.forEach((movie) => {
      matrix[userId][movie] = 0;
    });
  });

  sourceRatings.forEach(({ userId, movie, rating }) => {
    matrix[userId][movie] = rating;
  });

  return matrix;
}

function buildUserMeans(sourceRatings) {
  const userBuckets = new Map();

  sourceRatings.forEach(({ userId, rating }) => {
    if (!userBuckets.has(userId)) {
      userBuckets.set(userId, []);
    }
    userBuckets.get(userId).push(rating);
  });

  const means = {};
  users.forEach((userId) => {
    means[userId] = average(userBuckets.get(userId) ?? [globalMean]);
  });
  return means;
}

function buildSimilarityMatrix(matrix) {
  const similarity = {};

  users.forEach((userA) => {
    similarity[userA] = {};
    users.forEach((userB) => {
      similarity[userA][userB] = cosine(
        movies.map((movie) => matrix[userA][movie]),
        movies.map((movie) => matrix[userB][movie]),
      );
    });
  });

  return similarity;
}

function recommendMovies(userId, topN) {
  const ratedMovies = new Set(
    trainRatings.filter((entry) => entry.userId === userId).map((entry) => entry.movie),
  );

  return movies
    .filter((movie) => !ratedMovies.has(movie))
    .map((movie) => ({ movie, score: predictRating(userId, movie) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topN);
}

function predictRating(userId, movie) {
  let numerator = 0;
  let denominator = 0;

  users.forEach((neighborId) => {
    if (neighborId === userId) {
      return;
    }

    const neighborRating = trainMatrix[neighborId][movie];
    const similarity = similarityMatrix[userId][neighborId];

    if (neighborRating <= 0 || similarity <= 0) {
      return;
    }

    numerator += similarity * neighborRating;
    denominator += Math.abs(similarity);
  });

  if (denominator > 0) {
    return clamp(numerator / denominator, 1, maxRating);
  }

  return clamp(userMeans[userId] ?? globalMean, 1, maxRating);
}

function evaluateModel(topK) {
  let squaredError = 0;
  let absoluteError = 0;
  const seenRecommendations = new Set();
  let relevantHoldouts = 0;
  let hits = 0;

  testRatings.forEach((entry) => {
    const predicted = predictRating(entry.userId, entry.movie);
    squaredError += (predicted - entry.rating) ** 2;
    absoluteError += Math.abs(predicted - entry.rating);

    const recommendations = recommendMovies(entry.userId, topK).map((item) => item.movie);
    recommendations.forEach((movie) => seenRecommendations.add(movie));

    if (entry.rating >= 4) {
      relevantHoldouts += 1;
      if (recommendations.includes(entry.movie)) {
        hits += 1;
      }
    }
  });

  const rmse = Math.sqrt(squaredError / testRatings.length);
  const mae = absoluteError / testRatings.length;
  const hitRate = hits / testRatings.length;
  const coverage = (seenRecommendations.size / movies.length) * 100;

  return { rmse, mae, hitRate, coverage, relevantHoldouts };
}

function evaluateAtK(topK) {
  let hits = 0;
  let relevant = 0;

  testRatings.forEach((entry) => {
    if (entry.rating < 4) {
      return;
    }

    relevant += 1;
    const recommended = recommendMovies(entry.userId, topK).map((item) => item.movie);
    if (recommended.includes(entry.movie)) {
      hits += 1;
    }
  });

  return {
    precision: relevant > 0 ? hits / (topK * relevant) : 0,
    recall: relevant > 0 ? hits / relevant : 0,
  };
}

function buildExplanation(userId, movie) {
  const contributors = users
    .filter((neighborId) => neighborId !== userId)
    .map((neighborId) => ({
      neighborId,
      similarity: similarityMatrix[userId][neighborId],
      rating: trainMatrix[neighborId][movie],
    }))
    .filter((entry) => entry.similarity > 0 && entry.rating > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 2);

  if (!contributors.length) {
    return [`Fallback score used`, `No strong neighbors rated this title`];
  }

  return contributors.map(
    (entry) => `User ${entry.neighborId} · sim ${entry.similarity.toFixed(2)} · rated ${entry.rating}`,
  );
}

function cosine(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

function heatColor(value) {
  const normalized = Math.max(0, Math.min(1, value));
  const hue = 200 + normalized * 55;
  const saturation = 78;
  const lightness = 18 + normalized * 42;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}