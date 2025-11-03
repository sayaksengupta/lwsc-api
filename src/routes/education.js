const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createBookmarkSchema } = require('../validators/educationValidator');
const {
  listArticles,
  getArticle,
  listBookmarks,
  createBookmark,
  deleteBookmark
} = require('../controllers/educationController');

router.get('/articles', validate(listQuerySchema, 'query'), listArticles);
router.get('/articles/:id', getArticle);

router.get('/bookmarks', auth, listBookmarks);
router.post('/bookmarks', auth, validate(createBookmarkSchema), createBookmark);
router.delete('/bookmarks/:id', auth, deleteBookmark);

module.exports = router;