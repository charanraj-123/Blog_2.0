const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/posts/:id/comments
router.get('/', (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.prepare(`
    SELECT c.id, c.text, c.createdAt, c.parentId, c.authorId,
           u.fullName as authorName
    FROM comments c
    JOIN users u ON u.id = c.authorId
    WHERE c.postId = ?
    ORDER BY c.createdAt ASC
  `).all(req.params.id);

  // Build nested structure (1 level deep)
  const top = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  top.forEach(c => {
    c.replies = replies.filter(r => r.parentId === c.id);
  });

  res.json({ comments: top, total: comments.length });
});

// POST /api/posts/:id/comments
router.post('/', authenticateToken, (req, res) => {
  const { text, parentId } = req.body;

  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (parentId) {
    const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND postId = ?').get(parentId, req.params.id);
    if (!parent) return res.status(400).json({ error: 'Parent comment not found' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO comments (id, text, postId, authorId, parentId)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, text.trim(), req.params.id, req.user.id, parentId || null);

  const comment = db.prepare(`
    SELECT c.id, c.text, c.createdAt, c.parentId, c.authorId,
           u.fullName as authorName
    FROM comments c JOIN users u ON u.id = c.authorId
    WHERE c.id = ?
  `).get(id);

  comment.replies = [];
  res.status(201).json({ message: 'Comment added successfully', comment });
});

// DELETE /api/posts/:id/comments/:commentId
router.delete('/:commentId', authenticateToken, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND postId = ?')
    .get(req.params.commentId, req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ message: 'Comment deleted successfully' });
});

module.exports = router;
