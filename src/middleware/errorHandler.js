const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Something went wrong' }
    });
  };
  
  module.exports = { errorHandler };