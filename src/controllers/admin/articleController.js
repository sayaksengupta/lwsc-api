const Article = require('../../models/Article');
const { getPagination } = require('../../utils/pagination');
const { getRelativePath } = require('../../config/upload');

const listArticles = async (req, res) => {
  try {
    const { page, pageSize, search, source } = req.query;
    const { skip, limit } = getPagination(page, pageSize);

    const filter = {};
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') }
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter)
    ]);

    res.json({
      data: articles,
      meta: { page: parseInt(page || 1), pageSize: limit, total }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, excerpt, url, source = 'internal', publishedAt } = req.body;
    
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = getRelativePath(req.file.path);
    }

    // For internal articles, we use the _id as externalId if not provided
    const article = new Article({
      source,
      title,
      excerpt,
      url,
      imageUrl,
      publishedAt: publishedAt || new Date(),
      externalId: 'temp'
    });
    
    if (source === 'internal') {
      article.externalId = article._id.toString();
    } else {
      article.externalId = req.body.externalId || article._id.toString();
    }

    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { title, excerpt, url, publishedAt, source } = req.body;
    
    const updateData = {
      title,
      excerpt,
      url,
      publishedAt,
      source
    };

    if (req.file) {
      updateData.imageUrl = getRelativePath(req.file.path);
    } else if (req.body.imageUrl !== undefined) {
      updateData.imageUrl = req.body.imageUrl;
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
};
