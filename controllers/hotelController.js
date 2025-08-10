// --- Requires ---
const Hotel = require('../models/Hotel');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// --- Multer config ---
const storage = multer.memoryStorage();
exports.uploadHotelImages = multer({ storage }).fields([
  { name: 'hotelLogo', maxCount: 1 },
  { name: 'hotelOfferBanner', maxCount: 1 }
]);

// --- Controller functions ---

// List all hotels
exports.listHotels = async (req, res) => {
  const hotels = await Hotel.find({});
  res.render('hotels/index', { hotels, user: req.user, layout: 'layouts/dashboard-boilerplate' });
};

// Show new hotel form
exports.renderNewHotelForm = (req, res) => {
  res.render('hotels/new', { layout: 'layouts/dashboard-boilerplate', user: req.user });
};

// Create hotel
exports.createHotel = async (req, res) => {
  try {
  const { hotelName, hotelDescription, hotelType, foodCategories, street, city, state, country, zipCode, selectedProfileId, selectedProfileSlug, selectedProfileName } = req.body;
    const hotelAddress = { street, city, state, country, zipCode };
    if (!hotelName || !hotelDescription || !hotelType || !street || !city || !zipCode || !selectedProfileId || !selectedProfileSlug || !selectedProfileName) {
      console.error('Hotel creation missing required fields:', {
        hotelName, hotelDescription, hotelType, street, city, zipCode, selectedProfileId, selectedProfileSlug, selectedProfileName
      });
      return res.status(400).render('hotels/new', {
        error: 'All required fields must be filled, including user profile.',
        layout: 'layouts/dashboard-boilerplate',
        user: req.user
      });
    }
    const hotelSlug = hotelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Hotel.findOne({ hotelSlug });
    if (existing) {
      console.error('Hotel creation failed: duplicate hotelSlug', hotelSlug);
      return res.status(400).render('hotels/new', {
        error: 'A hotel with this name already exists.',
        layout: 'layouts/dashboard-boilerplate',
        user: req.user
      });
    }
    let hotelLogo;
    let hotelOfferBanner;
    if (req.files) {
      if (req.files['hotelLogo'] && req.files['hotelLogo'][0]) {
        const logoBuffer = req.files['hotelLogo'][0].buffer;
        const logoStream = Readable.from(logoBuffer);
        const logoUpload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels' }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
          logoStream.pipe(stream);
        });
        hotelLogo = logoUpload.secure_url;
      }
      if (req.files['hotelOfferBanner'] && req.files['hotelOfferBanner'][0]) {
        const bannerBuffer = req.files['hotelOfferBanner'][0].buffer;
        const bannerStream = Readable.from(bannerBuffer);
        const bannerUpload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels' }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
          bannerStream.pipe(stream);
        });
        hotelOfferBanner = bannerUpload.secure_url;
      }
    }
    const hotelData = {
      hotelName,
      hotelDescription,
      hotelType,
      hotelAddress,
      foodCategories: Array.isArray(foodCategories) ? foodCategories : (foodCategories ? [foodCategories] : []),
      hotelSlug,
      hotelLogo,
      hotelOfferBanner,
      createdByProfile: selectedProfileId,
      createdByProfileUsername: selectedProfileSlug,
      createdByProfileName: selectedProfileName,
      createdByAdmin: req.user ? req.user._id : undefined,
      createdByAdminUsername: req.user ? req.user.username : undefined
    };
    try {
      const hotel = new Hotel(hotelData);
      // Add initial version entry
      hotel.versions = [{
        changedAt: new Date(),
        changedBy: req.user ? req.user._id : undefined,
        changedByName: req.user ? req.user.username : undefined,
        changes: {},
        snapshot: hotel.toObject()
      }];
      await hotel.save();
      res.redirect(`/hotel/${hotel.hotelSlug}`);
    } catch (err) {
      console.error('Error saving hotel:', err);
      return res.status(500).render('hotels/new', {
        error: 'Error saving hotel to database.',
        layout: 'layouts/dashboard-boilerplate',
        user: req.user
      });
    }
  } catch (err) {
    res.status(500).render('hotels/new', {
      error: 'Error creating hotel.',
      layout: 'layouts/dashboard-boilerplate',
      user: req.user
    });
  }
};

// Show hotel page
exports.showHotelPage = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    res.render('hotels/show', {
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      hotelDescription: hotel.hotelDescription,
      hotelLogo: hotel.hotelLogo,
      hotelOfferBanner: hotel.hotelOfferBanner,
      hotelType: hotel.hotelType,
      foodCategories: hotel.foodCategories || [],
      hotelAddress: hotel.hotelAddress,
      price: hotel.price,
      createdByUsername: hotel.adminUser ? hotel.adminUser.username : hotel.createdByUsername,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotel show page');
  }
};

// Show edit hotel form
exports.renderEditHotelForm = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    res.render('hotels/edit', {
      hotel,
      user: req.user,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading hotel edit page');
  }
};

// Update hotel
exports.updateHotel = async (req, res) => {
  try {
    const { hotelName, hotelDescription, hotelType, hotelAddress, foodCategories, price } = req.body;
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    const originalName = hotel.hotelName;
    hotel.hotelName = hotelName || hotel.hotelName;
    hotel.hotelDescription = hotelDescription || hotel.hotelDescription;
    hotel.hotelType = hotelType || hotel.hotelType;
    hotel.hotelAddress = hotelAddress || hotel.hotelAddress;
    // Normalize foodCategories and ensure itemPrice is mapped to item.price
    if (Array.isArray(foodCategories)) {
      hotel.foodCategories = foodCategories.map(category => {
        let newCategory = { ...category };
        if (Array.isArray(category.foodItems)) {
          newCategory.foodItems = category.foodItems.map(item => {
            let newItem = { ...item };
            // Prefer itemPrice, fallback to price
            if (typeof item.itemPrice !== 'undefined') {
              newItem.price = item.itemPrice;
            } else if (typeof item.price !== 'undefined') {
              newItem.price = item.price;
            }
            return newItem;
          });
        }
        return newCategory;
      });
    } else if (foodCategories) {
      hotel.foodCategories = [foodCategories];
    } else {
      hotel.foodCategories = [];
    }
    if (hotelName && hotelName !== originalName) {
      const newSlug = hotelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (newSlug !== hotel.hotelSlug) {
        const exists = await Hotel.findOne({ hotelSlug: newSlug });
        if (exists) {
          return res.status(400).render('hotels/edit', {
            hotel,
            user: req.user,
            layout: 'layouts/dashboard-boilerplate',
            error: 'A hotel with this name already exists.'
          });
        }
        hotel.hotelSlug = newSlug;
      }
    }
    // Track admin who updated
    hotel.updatedBy = req.user ? req.user._id : undefined;
    // Build changes diff
    const changes = {};
    if (hotel.hotelName !== hotelName) changes['hotelName'] = { from: hotel.hotelName, to: hotelName };
    if (hotel.hotelDescription !== hotelDescription) changes['hotelDescription'] = { from: hotel.hotelDescription, to: hotelDescription };
    if (hotel.hotelType !== hotelType) changes['hotelType'] = { from: hotel.hotelType, to: hotelType };
    if (JSON.stringify(hotel.hotelAddress) !== JSON.stringify(hotelAddress)) changes['hotelAddress'] = { from: hotel.hotelAddress, to: hotelAddress };
    if (JSON.stringify(hotel.foodCategories) !== JSON.stringify(foodCategories)) changes['foodCategories'] = { from: hotel.foodCategories, to: foodCategories };
    // Version tracking: push new version entry
    if (!hotel.versions) hotel.versions = [];
    hotel.versions.push({
      changedAt: new Date(),
      changedBy: req.user ? req.user._id : undefined,
      changedByName: req.user ? req.user.username : undefined,
    });
    await hotel.save();
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    console.error(err);
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    res.status(500).render('hotels/edit', {
      hotel,
      user: req.user,
      layout: 'layouts/dashboard-boilerplate',
      error: 'Error updating hotel.'
    });
  }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    const deleteFromCloudinary = async (imageUrl) => {
      if (!imageUrl) return;
      const match = imageUrl.match(/\/hotels\/([^./]+)\./);
      if (match && match[1]) {
        try {
          await cloudinary.uploader.destroy('asparsh/hotels/' + match[1]);
        } catch (e) {
          console.error('Cloudinary deletion error:', e);
        }
      }
    };
    await deleteFromCloudinary(hotel.hotelLogo);
    await deleteFromCloudinary(hotel.hotelOfferBanner);
    await Hotel.deleteOne({ hotelSlug: req.params.hotelSlug });
    const hotels = await Hotel.find({});
    const user = req.user && req.user.slug ? req.user : { slug: '' };
    res.render('hotels/index', { hotels, user, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting hotel');
  }
};
