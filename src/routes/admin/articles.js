const router = require('express').Router();
const { 
  listArticles, getArticle, createArticle, 
  updateArticle, deleteArticle 
} = require('../../controllers/admin/articleController');
const { adminAuth } = require('../../middleware/adminAuth');

// All routes protected by adminAuth
router.use(adminAuth);

router.get('/', listArticles);
router.get('/:id', getArticle);
router.post('/', createArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

module.exports = router;
