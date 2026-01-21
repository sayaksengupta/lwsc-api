const router = require('express').Router();
const { 
  listArticles, getArticle, createArticle, 
  updateArticle, deleteArticle 
} = require('../../controllers/admin/articleController');
const { adminAuth } = require('../../middleware/adminAuth');
const { uploadIcon } = require('../../config/upload');

// All routes protected by adminAuth
router.use(adminAuth);

router.get('/', listArticles);
router.get('/:id', getArticle);

router.post('/', uploadIcon.single('image'), (req, res, next) => {
  req.body.type = 'article';
  next();
}, createArticle);

router.put('/:id', uploadIcon.single('image'), (req, res, next) => {
  req.body.type = 'article';
  next();
}, updateArticle);
router.delete('/:id', deleteArticle);

module.exports = router;
