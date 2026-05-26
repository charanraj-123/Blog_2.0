const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: get post with author info
function getPostWithAuthor(id) {
  return db.prepare(`
    SELECT p.*, u.fullName as authorName,
           (SELECT COUNT(*) FROM comments c WHERE c.postId = p.id) as commentCount
    FROM posts p
    JOIN users u ON u.id = p.authorId
    WHERE p.id = ?
  `).get(id);
}

// GET /api/posts — all posts with pagination + category filter
router.get('/', (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page) || 1);
  const limit    = Math.min(20, parseInt(req.query.limit) || 6);
  const offset   = (page - 1) * limit;
  const category = req.query.category || '';
  const search   = req.query.search || '';

  let where = '1=1';
  const params = [];

  if (category && category !== 'All') {
    where += ' AND p.category = ?';
    params.push(category);
  }
  if (search) {
    where += ' AND (p.title LIKE ? OR p.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...params).count;
  const posts = db.prepare(`
    SELECT p.id, p.title, p.coverImage, p.category, p.tags, p.createdAt, p.authorId,
           u.fullName as authorName,
           SUBSTR(p.content, 1, 200) as excerpt,
           (SELECT COUNT(*) FROM comments c WHERE c.postId = p.id) as commentCount
    FROM posts p
    JOIN users u ON u.id = p.authorId
    WHERE ${where}
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  posts.forEach(p => { try { p.tags = JSON.parse(p.tags || '[]'); } catch { p.tags = []; } });

  res.json({ posts, total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/posts/:id — single post
router.get('/:id', (req, res) => {
  const post = getPostWithAuthor(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  try { post.tags = JSON.parse(post.tags || '[]'); } catch { post.tags = []; }
  res.json(post);
});

// POST /api/posts — create post (auth required)
router.post('/', authenticateToken, (req, res) => {
  const { title, content, coverImage, category, tags } = req.body;

  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  if (!category) return res.status(400).json({ error: 'Category is required' });

  const id = uuidv4();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []));

  db.prepare(`
    INSERT INTO posts (id, title, content, coverImage, category, tags, authorId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title.trim(), content.trim(), coverImage || '', category, tagsJson, req.user.id);

  const post = getPostWithAuthor(id);
  try { post.tags = JSON.parse(post.tags || '[]'); } catch { post.tags = []; }
  res.status(201).json({ message: 'Post created successfully', post });
});

// PUT /api/posts/:id — update post (owner only)
router.put('/:id', authenticateToken, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized to edit this post' });

  const { title, content, coverImage, category, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []));

  db.prepare(`
    UPDATE posts SET title=?, content=?, coverImage=?, category=?, tags=?, updatedAt=datetime('now')
    WHERE id=?
  `).run(title.trim(), content.trim(), coverImage || '', category || post.category, tagsJson, req.params.id);

  const updated = getPostWithAuthor(req.params.id);
  try { updated.tags = JSON.parse(updated.tags || '[]'); } catch { updated.tags = []; }
  res.json({ message: 'Post updated successfully', post: updated });
});

// DELETE /api/posts/:id — delete post (owner only)
router.delete('/:id', authenticateToken, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this post' });

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted successfully' });
});

module.exports = router;
