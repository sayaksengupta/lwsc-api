const Article = require('../models/Article');

// Seed internal articles (run once)
const seedInternalArticles = async () => {
  const count = await Article.countDocuments({ source: 'internal' });
  if (count > 0) return;

  const internals = [
    {
      source: 'internal',
      externalId: 'int-1',
      title: 'Managing Sickle Cell Pain at Home',
      excerpt: 'Learn simple techniques to reduce pain crises.',
      url: 'https://example.com/articles/pain-at-home',
      publishedAt: new Date('2025-01-15')
    },
    {
      source: 'internal',
      externalId: 'int-2',
      title: 'Hydration and Sickle Cell',
      excerpt: 'Why water is your best friend.',
      url: 'https://example.com/articles/hydration',
      publishedAt: new Date('2025-02-01')
    }
  ];

  await Article.insertMany(internals);
};

// Mock RSS fetch (in real app: cron + rss-parser)
const fetchRssArticles = async () => {
  const existing = await Article.find({ source: 'rss' }).select('externalId');
  const existingIds = new Set(existing.map(a => a.externalId));

  const mockRss = [
    {
      source: 'rss',
      externalId: 'rss-101',
      title: 'New Study on Hydroxyurea',
      excerpt: 'Promising results for adolescents.',
      url: 'https://healthnews.com/rss/101',
      publishedAt: new Date('2025-03-20')
    },
    {
      source: 'rss',
      externalId: 'rss-102',
      title: 'Exercise Tips for SCD Patients',
      excerpt: 'Safe ways to stay active.',
      url: 'https://healthnews.com/rss/102',
      publishedAt: new Date('2025-03-18')
    }
  ];

  const newArticles = mockRss.filter(a => !existingIds.has(a.externalId));
  if (newArticles.length > 0) {
    await Article.insertMany(newArticles);
  }
};

module.exports = { seedInternalArticles, fetchRssArticles };