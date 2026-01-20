const Facility = require('../../models/Facility');
const { getPagination } = require('../../utils/pagination');

const listFacilities = async (req, res) => {
  try {
    const { page, pageSize, search } = req.query;
    const { skip, limit } = getPagination(page, pageSize);

    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const [facilities, total] = await Promise.all([
      Facility.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Facility.countDocuments(filter)
    ]);

    res.json({
      data: facilities,
      meta: { page: parseInt(page || 1), pageSize: limit, total }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFacility = async (req, res) => {
  try {
    const {
      name, description, type, address, state, country, 
      zipcode, mobile, email, website, coordinates 
    } = req.body;

    // coordinates expected as [lng, lat]
    const facility = await Facility.create({
      name, description, type, address, state, country,
      zipcode, mobile, email, website,
      location: {
        type: 'Point',
        coordinates: coordinates
      }
    });

    res.status(201).json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateFacility = async (req, res) => {
  try {
    const {
      name, description, type, address, state, country, 
      zipcode, mobile, email, website, coordinates 
    } = req.body;

    const updateData = {
      name, description, type, address, state, country,
      zipcode, mobile, email, website
    };

    if (coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: coordinates
      };
    }

    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listFacilities,
  getFacility,
  createFacility,
  updateFacility,
  deleteFacility
};
