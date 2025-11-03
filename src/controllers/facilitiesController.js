const Facility = require('../models/Facility');
const { getPagination } = require('../utils/pagination');

const search = async (req, res) => {
  const { lat, lng, radius, type, query, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const maxDistance = (radius || 10) * 1000; // km to meters

  const geoFilter = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: maxDistance
      }
    }
  };

  const filters = { ...geoFilter };
  if (type) filters.type = type;
  if (query) {
    filters.$text = { $search: query };
  }

  const [data, total] = await Promise.all([
    Facility.find(filters)
      .skip(skip)
      .limit(limit)
      .lean(),
    Facility.countDocuments(filters)
  ]);

  // Add distance to each result
  const results = data.map(facility => {
    const [facilityLng, facilityLat] = facility.location.coordinates;
    const distance = calculateDistance(lat, lng, facilityLat, facilityLng);
    return {
      ...facility,
      distance: Number(distance.toFixed(2)) // km
    };
  });

  res.json({
    data: results,
    meta: { page: parseInt(page), pageSize: limit, total, radius: parseFloat(radius) }
  });
};

// Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = { search };