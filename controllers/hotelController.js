// --- Requires ---
const Hotel = require('../models/Hotel');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Ensure Cloudinary is configured (safe to call multiple times)
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} catch (e) {
  console.warn('Cloudinary config warning:', e && e.message);
}

// --- Multer config ---
const storage = multer.memoryStorage();
exports.uploadHotelImages = multer({ storage }).fields([
  { name: 'hotelLogo', maxCount: 1 },
  { name: 'hotelOfferBanner', maxCount: 1 }
]);

// Helper to delete Cloudinary image by url
async function deleteCloudinaryImage(imageUrl) {
  if (!imageUrl) return;
  try {
    let publicId = null;
    const m = imageUrl.match(/\/asparsh\/hotels\/([^.?/\\]+)(?:\.|$)/);
    if (m && m[1]) {
      publicId = `asparsh/hotels/${m[1]}`;
    } else {
      const m2 = imageUrl.match(/\/([^/?#]+)($|\?|#)/);
      if (m2 && m2[1]) {
        const name = m2[1].split('.')[0];
        publicId = `asparsh/hotels/${name}`;
      }
    }
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } else {
      console.warn('Could not derive Cloudinary publicId for:', imageUrl);
    }
  } catch (e) {
    console.error('Cloudinary deletion error:', e);
  }
}

// --- Controller functions ---

// List all hotels
exports.listHotels = async (req, res) => {
  const hotels = await Hotel.find({});
  res.render('hotels/index', { hotels, user: req.user, layout: 'layouts/dashboard-boilerplate' });
};

// Show new hotel form
exports.renderNewHotelForm = (req, res) => {
  // Derive defaults from schema when available so the form can be prefilled
  function schemaDefault(path) {
    try {
      const p = Hotel.schema.path(path);
      if (p && p.options && typeof p.options.default !== 'undefined') return p.options.default;
    } catch (e) {}
    return '';
  }
  const defaults = {
    hotelAddress: {
      street: '',
      city: schemaDefault('hotelAddress.city'),
      state: schemaDefault('hotelAddress.state'),
      country: schemaDefault('hotelAddress.country'),
      zipCode: schemaDefault('hotelAddress.zipCode')
    }
  };
  res.render('hotels/new', { layout: 'layouts/dashboard-boilerplate', user: req.user, defaults });
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
        try {
          const logoUpload = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels', resource_type: 'image' }, (err, result) => {
              if (err) return reject(err);
              resolve(result);
            });
            streamifier.createReadStream(logoBuffer).pipe(stream);
          });
      hotelLogo = logoUpload.secure_url;
      // store public id
      var hotelLogoPublicId = logoUpload.public_id || null;
        } catch (uploadErr) {
          console.error('Cloudinary hotelLogo upload failed:', uploadErr);
        }
      }
    if (req.files['hotelOfferBanner'] && req.files['hotelOfferBanner'][0]) {
        const bannerBuffer = req.files['hotelOfferBanner'][0].buffer;
        try {
          const bannerUpload = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels', resource_type: 'image' }, (err, result) => {
              if (err) return reject(err);
              resolve(result);
            });
            streamifier.createReadStream(bannerBuffer).pipe(stream);
          });
      hotelOfferBanner = bannerUpload.secure_url;
      var hotelOfferBannerPublicId = bannerUpload.public_id || null;
        } catch (uploadErr) {
          console.error('Cloudinary hotelOfferBanner upload failed:', uploadErr);
        }
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
  hotelLogoPublicId: hotelLogoPublicId || null,
  hotelOfferBannerPublicId: hotelOfferBannerPublicId || null,
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
    // Handle uploaded replacement images (if any)
    try {
      if (req.files) {
        // hotelLogo
        if (req.files['hotelLogo'] && req.files['hotelLogo'][0]) {
          const logoBuffer = req.files['hotelLogo'][0].buffer;
          try {
            const logoUpload = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels', resource_type: 'image' }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
              streamifier.createReadStream(logoBuffer).pipe(stream);
            });
            // Delete old logo if exists and different
            if (hotel.hotelLogo && hotel.hotelLogo !== logoUpload.secure_url) {
              // Prefer to delete using stored public id
              if (hotel.hotelLogoPublicId) {
                try { await cloudinary.uploader.destroy(hotel.hotelLogoPublicId, { resource_type: 'image' }); } catch (e) { console.error('Error deleting old hotelLogo by publicId:', e); }
              } else {
                await deleteCloudinaryImage(hotel.hotelLogo);
              }
            }
            hotel.hotelLogo = logoUpload.secure_url;
            hotel.hotelLogoPublicId = logoUpload.public_id || hotel.hotelLogoPublicId || null;
          } catch (uploadErr) {
            console.error('Cloudinary hotelLogo upload failed during update:', uploadErr);
          }
        }
        // hotelOfferBanner
        if (req.files['hotelOfferBanner'] && req.files['hotelOfferBanner'][0]) {
          const bannerBuffer = req.files['hotelOfferBanner'][0].buffer;
          try {
            const bannerUpload = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream({ folder: 'asparsh/hotels', resource_type: 'image' }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
              streamifier.createReadStream(bannerBuffer).pipe(stream);
            });
            if (hotel.hotelOfferBanner && hotel.hotelOfferBanner !== bannerUpload.secure_url) {
              if (hotel.hotelOfferBannerPublicId) {
                try { await cloudinary.uploader.destroy(hotel.hotelOfferBannerPublicId, { resource_type: 'image' }); } catch (e) { console.error('Error deleting old hotelOfferBanner by publicId:', e); }
              } else {
                await deleteCloudinaryImage(hotel.hotelOfferBanner);
              }
            }
            hotel.hotelOfferBanner = bannerUpload.secure_url;
            hotel.hotelOfferBannerPublicId = bannerUpload.public_id || hotel.hotelOfferBannerPublicId || null;
          } catch (uploadErr) {
            console.error('Cloudinary hotelOfferBanner upload failed during update:', uploadErr);
          }
        }
      }
    } catch (e) {
      console.error('Error handling uploaded images in updateHotel:', e);
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
          try {
            // Try to extract public_id including the folder prefix 'asparsh/hotels/<id>'
            let publicId = null;
            // Pattern: .../asparsh/hotels/<publicId>.<ext>
            const m = imageUrl.match(/\/asparsh\/hotels\/([^.?/\\]+)(?:\.|$)/);
            if (m && m[1]) {
              publicId = `asparsh/hotels/${m[1]}`;
            } else {
              // Fallback: try to capture last path segment without extension
              const m2 = imageUrl.match(/\/([^/?#]+)($|\?|#)/);
              if (m2 && m2[1]) {
                const name = m2[1].split('.')[0];
                publicId = `asparsh/hotels/${name}`;
              }
            }
            if (publicId) {
              await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            } else {
              console.warn('Could not derive Cloudinary publicId for:', imageUrl);
            }
          } catch (e) {
            console.error('Cloudinary deletion error:', e);
          }
    };
    await deleteFromCloudinary(hotel.hotelLogo);
    await deleteFromCloudinary(hotel.hotelOfferBanner);
    // Also delete images referenced inside foodCategories
    try {
      if (Array.isArray(hotel.foodCategories)) {
        for (const cat of hotel.foodCategories) {
          if (cat) {
            if (cat.imagePublicId) {
              try { await cloudinary.uploader.destroy(cat.imagePublicId, { resource_type: 'image' }); } catch (e) { console.error('Error deleting category image by publicId:', e); }
            } else if (cat.imageUrl) {
              await deleteFromCloudinary(cat.imageUrl);
            }
            if (Array.isArray(cat.foodItems)) {
              for (const item of cat.foodItems) {
                if (item) {
                  if (item.imagePublicId) {
                    try { await cloudinary.uploader.destroy(item.imagePublicId, { resource_type: 'image' }); } catch (e) { console.error('Error deleting item image by publicId:', e); }
                  } else if (item.imageUrl) {
                    await deleteFromCloudinary(item.imageUrl);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error deleting foodCategories images:', e);
    }
    await Hotel.deleteOne({ hotelSlug: req.params.hotelSlug });
    const hotels = await Hotel.find({});
    const user = req.user && req.user.slug ? req.user : { slug: '' };
    res.render('hotels/index', { hotels, user, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting hotel');
  }
};
