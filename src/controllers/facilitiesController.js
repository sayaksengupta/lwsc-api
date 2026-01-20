const Facility = require('../models/Facility');
const { getPagination } = require('../utils/pagination');

const search = async (req, res) => {
  try {
    const { lat, lng, radius, type, query, zipcode, page, pageSize } = req.query;
    const { skip, limit } = getPagination(page, pageSize);

    const filter = {};

    // 1. Text Search (if name or address query provided)
    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { address: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ];
    }

    // 2. Zipcode Filter
    if (zipcode) {
      filter.zipcode = zipcode;
    }

    // 3. Type Filter
    if (type) {
      filter.type = type;
    }

    // 4. Geospatial Search (if lat/lng provided)
    if (lat && lng) {
      const maxDistance = (parseFloat(radius) || 50) * 1000; // Default 50km radius
      filter.location = {
        $near: {
          $geometry: { 
            type: 'Point', 
            coordinates: [parseFloat(lng), parseFloat(lat)] 
          },
          $maxDistance: maxDistance
        }
      };
    }

    const [data, total] = await Promise.all([
      Facility.find(filter)
        .skip(skip)
        .limit(limit)
        .lean(),
      Facility.countDocuments(filter)
    ]);

    // Enhance response with distance if lat/lng was provided
    let results = data;
    if (lat && lng) {
      results = data.map(facility => {
        const [fLng, fLat] = facility.location.coordinates;
        const dist = calculateDistance(parseFloat(lat), parseFloat(lng), fLat, fLng);
        return { ...facility, distance: Number(dist.toFixed(2)) };
      });
    }

    res.json({
      data: results,
      meta: { 
        page: parseInt(page || 1), 
        pageSize: limit, 
        total,
        params: { lat, lng, radius, type, query, zipcode }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const {
      name, description, type, address, state, country, 
      zipcode, mobile, email, website, coordinates 
    } = req.body;

    // Suggested facilities are unverified by default
    const facility = await Facility.create({
      name, description, type, address, state, country,
      zipcode, mobile, email, website,
      location: {
        type: 'Point',
        coordinates: coordinates // [lng, lat]
      },
      isVerified: false 
    });

    res.status(201).json({
      success: true,
      data: facility,
      message: "Facility submitted successfully. It will be visible after verification."
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Haversine formula for distance calculation in KM
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

module.exports = { search, create };