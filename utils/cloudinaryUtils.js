const { cloudinary } = require('../middleware/uploadMiddleware');

exports.deleteCloudinaryImage = async (imageRef) => {
    if (!imageRef) return;
    try {
        if (typeof imageRef === 'string' && imageRef.indexOf('/') >= 0 && imageRef.indexOf('asparsh') === 0) {
            await cloudinary.uploader.destroy(imageRef, { resource_type: 'image' });
            return;
        }
        if (imageRef && typeof imageRef === 'object' && imageRef.public_id) {
            await cloudinary.uploader.destroy(imageRef.public_id, { resource_type: 'image' });
            return;
        }
        if (typeof imageRef === 'string') {
            let publicId = null;
            const m = imageRef.match(/\/asparsh\/hotels\/([^.?/\\]+)(?:\.|$)/);
            if (m && m[1]) {
                publicId = `asparsh/hotels/${m[1]}`;
            } else {
                const m2 = imageRef.match(/\/([^/?#]+)($|\?|#)/);
                if (m2 && m2[1]) {
                    const name = m2[1].split('.')[0];
                    publicId = `asparsh/hotels/${name}`;
                }
            }
            if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        }
    } catch (e) {
        console.error('Cloudinary deletion error:', e);
    }
};