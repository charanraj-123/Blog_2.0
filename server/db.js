const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'blogsphere.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ─────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    fullName    TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    coverImage  TEXT,
    category    TEXT NOT NULL DEFAULT 'General',
    tags        TEXT,
    authorId    TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id        TEXT PRIMARY KEY,
    text      TEXT NOT NULL,
    postId    TEXT NOT NULL,
    authorId  TEXT NOT NULL,
    parentId  TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (postId)   REFERENCES posts(id)    ON DELETE CASCADE,
    FOREIGN KEY (authorId) REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE
  );
`);

// ─── Seed Data ───────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  console.log('🌱 Seeding database...');

  const password1 = bcrypt.hashSync('password123', 10);
  const password2 = bcrypt.hashSync('password456', 10);

  const user1Id = uuidv4();
  const user2Id = uuidv4();

  db.prepare(`INSERT INTO users (id, fullName, email, passwordHash) VALUES (?, ?, ?, ?)`)
    .run(user1Id, 'Alice Johnson', 'alice@example.com', password1);
  db.prepare(`INSERT INTO users (id, fullName, email, passwordHash) VALUES (?, ?, ?, ?)`)
    .run(user2Id, 'Bob Williams', 'bob@example.com', password2);

  const posts = [
    {
      id: uuidv4(),
      title: 'Getting Started with Node.js: A Beginner\'s Guide',
      content: `Node.js has revolutionized the way we build server-side applications. In this comprehensive guide, we'll walk you through everything you need to know to get started with Node.js development.

## What is Node.js?

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server side, enabling full-stack JavaScript development. This means you can use the same language for both frontend and backend development.

## Why Choose Node.js?

There are several compelling reasons to choose Node.js for your next project:

**Performance**: Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications.

**Large Ecosystem**: With npm (Node Package Manager), you have access to hundreds of thousands of open-source packages and tools.

**Community Support**: Node.js has a vibrant and active community that continually contributes to its growth and improvement.

## Setting Up Your First Node.js Project

Getting started is straightforward. First, install Node.js from the official website. Then, create a new directory for your project and initialize it with npm init.

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

With just a few lines of code, you have a working web server! This is one of the many reasons developers love Node.js — the simplicity and power it provides right out of the box.

## Next Steps

Once you're comfortable with the basics, explore Express.js for building RESTful APIs, connect to databases like MongoDB or SQLite, and learn about middleware patterns. The possibilities are endless with Node.js!`,
      coverImage: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop',
      category: 'Tech',
      tags: JSON.stringify(['nodejs', 'javascript', 'backend', 'beginners']),
      authorId: user1Id,
    },
    {
      id: uuidv4(),
      title: 'My Journey Through Southeast Asia: 30 Days of Adventure',
      content: `Backpacking through Southeast Asia was one of the most transformative experiences of my life. Over 30 incredible days, I visited Thailand, Vietnam, Cambodia, and Indonesia — each country offering its own unique culture, cuisine, and landscapes.

## Thailand: The Land of Smiles

My journey began in Bangkok, the vibrant capital of Thailand. The contrast between ancient temples and modern skyscrapers was immediately striking. I spent my first few days exploring:

- **Wat Pho**: Home to the famous Reclining Buddha, this temple complex is a must-visit
- **Chatuchak Weekend Market**: One of the world's largest markets with over 15,000 stalls
- **Khao San Road**: The backpacker hub that never sleeps

The food in Thailand was absolutely incredible. From pad thai on street corners to fresh mango sticky rice, every meal was an adventure.

## Vietnam: A Country of Contrasts

Vietnam surprised me with its incredible diversity. From the bustling streets of Ho Chi Minh City to the serene beauty of Ha Long Bay, every destination felt completely different.

Ha Long Bay was the highlight of my Vietnam experience. Waking up on a traditional junk boat, surrounded by limestone karsts emerging from emerald waters, felt like being in a dream.

## Cambodia: Temples and Resilience

No trip to Southeast Asia is complete without visiting Angkor Wat. Watching the sunrise over the ancient temple complex, reflected in the surrounding moat, is an experience that words cannot fully capture.

## Practical Tips

- **Best time to visit**: November to April for most of Southeast Asia
- **Budget**: $30-50 per day covers accommodation, food, and activities
- **Getting around**: Buses, trains, and budget airlines connect major cities
- **Must-have apps**: Google Maps offline, XE Currency, and a good VPN

Southeast Asia will steal your heart. Just go — you won't regret it!`,
      coverImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop',
      category: 'Travel',
      tags: JSON.stringify(['travel', 'asia', 'backpacking', 'adventure']),
      authorId: user2Id,
    },
    {
      id: uuidv4(),
      title: '10 Morning Habits That Changed My Life',
      content: `After years of hitting the snooze button and rushing through my mornings, I decided to overhaul my entire morning routine. Six months later, I'm more productive, healthier, and happier than ever before. Here are the 10 habits that made the biggest difference.

## 1. Wake Up at the Same Time Every Day

Consistency is key. Your body has a natural circadian rhythm, and waking up at the same time — even on weekends — helps regulate it. I wake up at 6:00 AM every day, and my body now wakes up naturally without an alarm.

## 2. Don't Check Your Phone First Thing

This was the hardest habit to break, but also the most impactful. Instead of immediately diving into emails and social media, I give myself the first hour completely phone-free. This sets a calm, intentional tone for the day.

## 3. Hydrate Immediately

After 7-8 hours of sleep, your body is dehydrated. I drink a large glass of water with lemon immediately upon waking. This kickstarts your metabolism and helps you feel more alert.

## 4. Move Your Body

Whether it's a 30-minute run, yoga, or even a brisk walk, getting your body moving in the morning releases endorphins and sets a positive tone for the day. I alternate between jogging and yoga depending on how I feel.

## 5. Practice Gratitude

Spending just 5 minutes writing down three things you're grateful for can dramatically shift your mindset. This simple practice has been backed by numerous psychological studies.

## 6. Meditate

Even 10 minutes of meditation in the morning can reduce anxiety, improve focus, and increase emotional resilience. I use the Headspace app, but even simple breathing exercises work wonders.

## 7. Plan Your Day

Before diving into work, I spend 15 minutes reviewing my calendar and identifying my three most important tasks for the day. This prevents the reactive, scattered feeling that comes from jumping straight into emails.

## 8. Eat a Nutritious Breakfast

Fueling your body with whole foods in the morning provides sustained energy throughout the day. I prepare my breakfast the night before — usually overnight oats or a smoothie — to save time.

## 9. Read or Learn Something New

Spending 20-30 minutes reading or listening to a podcast in the morning stimulates your mind and keeps you growing. I read non-fiction books focused on personal development, business, or science.

## 10. Cold Shower

Yes, it sounds brutal, but ending your shower with 30-60 seconds of cold water is genuinely transformative. It boosts alertness, improves circulation, and builds mental toughness.

Start with just one or two of these habits and gradually build. Remember: small, consistent changes compound into massive results over time.`,
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
      category: 'Lifestyle',
      tags: JSON.stringify(['lifestyle', 'productivity', 'health', 'habits']),
      authorId: user1Id,
    },
    {
      id: uuidv4(),
      title: 'Introduction to Machine Learning: Concepts Every Developer Should Know',
      content: `Machine learning is no longer just for data scientists. As a developer, understanding the fundamentals of ML will make you more versatile and help you build smarter applications. Let's explore the key concepts.

## What is Machine Learning?

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Instead of writing rules for every situation, you feed the algorithm data and let it discover patterns on its own.

## The Three Types of Machine Learning

### Supervised Learning
In supervised learning, the algorithm learns from labeled training data. Think of it like learning with a teacher — you're given examples with correct answers, and the algorithm learns to generalize.

Common applications: Email spam detection, image classification, house price prediction.

### Unsupervised Learning  
Here, the algorithm finds patterns in unlabeled data. It's like exploring without a map — the algorithm discovers structure on its own.

Common applications: Customer segmentation, anomaly detection, recommendation systems.

### Reinforcement Learning
The algorithm learns by interacting with an environment and receiving rewards or penalties. Think of training a dog with treats.

Common applications: Game playing (like AlphaGo), robotics, autonomous vehicles.

## Key Algorithms to Know

1. **Linear Regression**: Predicting continuous values
2. **Logistic Regression**: Binary classification
3. **Decision Trees**: Interpretable classification and regression
4. **Random Forests**: Ensemble of decision trees
5. **Neural Networks**: Deep learning for complex patterns
6. **K-Means Clustering**: Grouping similar data points

## Getting Started with Python

Python is the go-to language for machine learning, with libraries like scikit-learn, TensorFlow, and PyTorch making it accessible for developers.

\`\`\`python
from sklearn.linear_model import LinearRegression
import numpy as np

# Sample data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

# Train the model
model = LinearRegression()
model.fit(X, y)

# Make predictions
predictions = model.predict([[6], [7]])
print(predictions)
\`\`\`

## The Future is ML

Machine learning is transforming every industry. As a developer, the best time to start learning ML is now. Begin with the fundamentals, work on small projects, and gradually tackle more complex problems.`,
      coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop',
      category: 'Tech',
      tags: JSON.stringify(['machinelearning', 'AI', 'python', 'tech']),
      authorId: user2Id,
    },
    {
      id: uuidv4(),
      title: 'The Art of Minimalist Living: Less is Truly More',
      content: `Three years ago, I owned over 2,000 items. Today, I own fewer than 300. The transition to minimalist living was challenging, emotional, and ultimately one of the best decisions I've ever made.

## What is Minimalism?

Minimalism is not about owning as few things as possible or living in an empty white room. It's about intentionality — keeping only what adds value to your life and eliminating everything else.

## How I Started My Minimalist Journey

The catalyst was moving apartments. As I packed box after box, I realized I hadn't used most of these items in years. Why was I carrying all this stuff through life?

I started with the KonMari method — holding each item and asking, "Does this spark joy?" If not, it was donated, sold, or recycled. The process took three months and was deeply cathartic.

## The Benefits I've Experienced

**Mental Clarity**: A cluttered space creates a cluttered mind. With less stuff, I think more clearly and feel calmer at home.

**Financial Freedom**: When you stop buying things you don't need, money accumulates quickly. I've saved significantly more since embracing minimalism.

**More Time**: Less stuff means less time cleaning, organizing, and maintaining. I gained back hours each week.

**Better Quality**: Instead of buying many cheap items, I invest in fewer, higher-quality pieces that last longer.

**Environmental Impact**: Consuming less means a smaller environmental footprint. Each item not purchased represents resources not extracted.

## Practical Steps to Get Started

1. Start with one drawer or one category (like clothes)
2. Ask: Have I used this in the last year? Does it serve a purpose?
3. Be honest about "just in case" items
4. Digitize what you can (photos, documents, books)
5. Give yourself permission to let go

## What Minimalism Is NOT

Minimalism is not deprivation. You can still enjoy beautiful things, meaningful possessions, and comfortable living. The goal is to surround yourself with only what truly matters to you.

The journey to minimalism is deeply personal. Your version of minimalism will be completely unique to you — and that's perfectly fine.`,
      coverImage: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&auto=format&fit=crop',
      category: 'Lifestyle',
      tags: JSON.stringify(['minimalism', 'lifestyle', 'mindfulness', 'declutter']),
      authorId: user1Id,
    },
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (id, title, content, coverImage, category, tags, authorId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const offsets = ['-10 days', '-7 days', '-5 days', '-3 days', '-1 days'];
  posts.forEach((post, i) => {
    insertPost.run(
      post.id, post.title, post.content, post.coverImage,
      post.category, post.tags, post.authorId,
      offsets[i], offsets[i]
    );
  });

  const sampleComments = [
    { text: 'This is such a great article! Really helped me understand the topic better.', authorId: user2Id },
    { text: 'Excellent write-up! I\'ve been looking for something like this for a while.', authorId: user1Id },
    { text: 'Really insightful. Would love to see a follow-up post with more advanced topics!', authorId: user2Id },
  ];

  const insertComment = db.prepare(`
    INSERT INTO comments (id, text, postId, authorId, createdAt)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  const commentOffsets = ['-2 days', '-1 days', '-6 hours'];
  posts.forEach(post => {
    sampleComments.forEach((c, i) => {
      insertComment.run(uuidv4(), c.text, post.id, c.authorId, commentOffsets[i]);
    });
  });

  console.log('✅ Seed data inserted successfully!');
}

seedIfEmpty();

module.exports = db;
