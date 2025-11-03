const getPagination = (page = 1, pageSize = 50) => {
    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;
    return { skip, limit };
  };
  
  module.exports = { getPagination };