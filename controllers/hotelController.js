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
    const { hotelName, hotelDescription, hotelType, foodCategories, street, city, state, country, zipCode } = req.body;
    const hotelAddress = { street, city, state, country, zipCode };
    if (!hotelName || !hotelDescription || !hotelType || !street || !city || !zipCode) {
      return res.status(400).render('hotels/new', {
        error: 'All required fields must be filled.',
        layout: 'layouts/dashboard-boilerplate',
        user: req.user
      });
    }
    const hotelSlug = hotelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Hotel.findOne({ hotelSlug });
    if (existing) {
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
          const stream = cloudinary.uploader.upload_stream({ folder: 'hotels' }, (err, result) => {
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
          const stream = cloudinary.uploader.upload_stream({ folder: 'hotels' }, (err, result) => {
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
      createdByUsername: req.user ? req.user.username : undefined,
      adminUser: req.user ? req.user._id : undefined,
      createdBy: req.user ? req.user._id : undefined
    };
    if (hotelLogo) hotelData.hotelLogo = hotelLogo;
    if (hotelOfferBanner) hotelData.hotelOfferBanner = hotelOfferBanner;
    const hotel = new Hotel(hotelData);
    await hotel.save();
    console.log('Hotel created:', hotel);
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    console.error('Error in createHotel:', err);
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
    const { hotelName, hotelDescription, hotelType, hotelAddress, foodCategories } = req.body;
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    const originalName = hotel.hotelName;
    hotel.hotelName = hotelName || hotel.hotelName;
    hotel.hotelDescription = hotelDescription || hotel.hotelDescription;
    hotel.hotelType = hotelType || hotel.hotelType;
    hotel.hotelAddress = hotelAddress || hotel.hotelAddress;
    hotel.foodCategories = Array.isArray(foodCategories) ? foodCategories : (foodCategories ? [foodCategories] : []);
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
    await hotel.save();
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('hotels/edit', {
      hotel: await Hotel.findOne({ hotelSlug: req.params.hotelSlug }),
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
    if (!hotel) return res.status(404).send('Hotel not found');
    const deleteFromCloudinary = async (imageUrl) => {
      if (!imageUrl) return;
      const match = imageUrl.match(/\/hotels\/([^./]+)\./);
      if (match && match[1]) {
        try {
          await cloudinary.uploader.destroy('hotels/' + match[1]);
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
