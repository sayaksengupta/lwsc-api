const getPagination = (page = 1, pageSize = 50) => {
  let limit = parseInt(pageSize);
  if (isNaN(limit) || limit < 1) limit = 50;
  
  let pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  
  const skip = (pageNum - 1) * limit;
  return { skip, limit };
};

module.exports = { getPagination };