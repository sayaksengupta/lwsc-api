const Article = require('../models/Article');
const Bookmark = require('../models/Bookmark');
const { getPagination } = require('../utils/pagination');
const { seedInternalArticles, fetchRssArticles } = require('../services/rssService');

const listArticles = async (req, res) => {
  const { source, query, page=1, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  // Ensure data
  await seedInternalArticles();
  if (!source || source === 'rss') await fetchRssArticles();

  const filter = {};
  if (source) filter.source = source;
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { excerpt: { $regex: query, $options: 'i' } }
    ];
  }

  const [data, total] = await Promise.all([
    Article.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter)
  ]);

  res.json({
    data,
    meta: { page: parseInt(page), pageSize: limit, total }
  });
};

const getArticle = async (req, res) => {
  const { id } = req.params;
  const article = await Article.findById(id).lean();
  if (!article) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }
  res.json(article);
};

const listBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id })
    .sort({ savedAt: -1 })
    .lean();
  res.json(bookmarks);
};

const createBookmark = async (req, res) => {
  const { articleId } = req.body;
  const article = await Article.findById(articleId);
  if (!article) {
    return res.status(404).json({ error: { code: 'ARTICLE_NOT_FOUND' } });
  }

  const existing = await Bookmark.findOne({ userId: req.user._id, articleId });
  if (existing) {
    return res.status(400).json({ error: { code: 'ALREADY_BOOKMARKED' } });
  }

  const bookmark = await Bookmark.create({
    userId: req.user._id,
    articleId,
    title: article.title,
    url: article.url
  });

  res.status(201).json(bookmark);
};

const deleteBookmark = async (req, res) => {
  const { id } = req.params;
  const result = await Bookmark.deleteOne({ _id: id, userId: req.user._id });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json({ success: true });
};

module.exports = {
  listArticles,
  getArticle,
  listBookmarks,
  createBookmark,
  deleteBookmark
};