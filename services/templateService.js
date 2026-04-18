const templateRepository = require('../repositories/templateRepository');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

exports.registerNewTemplate = async (bodyData, file, profileId, adminId) => {
    // 1. Check if the exact EJS filename is already registered
    const existingTemplate = await templateRepository.findTemplateByFileName(bodyData.fileName);
    if (existingTemplate) {
        throw new Error(`A template with the filename '${bodyData.fileName}' is already registered.`);
    }

    // 2. Handle Thumbnail Upload to Cloudinary
    let thumbnailUrl = '';
    if (file) {
        // Using the utility you defined in uploadMiddleware.js
        const uploadResult = await uploadToCloudinary(file.buffer, 'template-thumbnails', file.mimetype);
        thumbnailUrl = uploadResult.secure_url;
    } else {
        throw new Error('A preview thumbnail image is required to register a design.');
    }

    // 3. Parse Custom Fields
    // The frontend UI will likely send the custom fields array as a stringified JSON object
    let customFields = [];
    if (bodyData.customFields) {
        try {
            customFields = typeof bodyData.customFields === 'string'
                ? JSON.parse(bodyData.customFields)
                : bodyData.customFields;
        } catch (err) {
            throw new Error('Invalid format for custom fields. Must be valid JSON.');
        }
    }

    // 4. Construct and Save
    const newTemplateData = {
        name: bodyData.name.trim(),
        profileId,
        createdByAdmin: adminId,
        category: bodyData.category ? bodyData.category.trim() : 'General',
        templateKey: bodyData.fileName.trim(), // Use fileName as the unique templateKey
        fileName: bodyData.fileName.trim(),
        thumbnailUrl,
        customFields,
        isActive: bodyData.isActive !== 'false' // Default to true unless explicitly false
    };

    return await templateRepository.createTemplate(newTemplateData);
};

// Add to services/templateService.js

exports.updateTemplate = async (id, bodyData, file) => {
    // 1. Verify the template exists
    const existingTemplate = await templateRepository.findTemplateById(id);
    if (!existingTemplate) {
        throw new Error('Template not found.');
    }

    // 2. Handle optional Thumbnail Upload
    // If no new file is uploaded, we keep the existing image URL
    let thumbnailUrl = existingTemplate.thumbnailUrl;
    if (file) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'template-thumbnails', file.mimetype);
        thumbnailUrl = uploadResult.secure_url;
    }

    // 3. Parse Custom Fields securely
    let customFields = existingTemplate.customFields;
    if (bodyData.customFields) {
        try {
            customFields = typeof bodyData.customFields === 'string'
                ? JSON.parse(bodyData.customFields)
                : bodyData.customFields;
        } catch (err) {
            throw new Error('Invalid format for custom fields. Must be valid JSON.');
        }
    }

    // 4. Construct the update payload
    const updateData = {
        name: bodyData.name ? bodyData.name.trim() : existingTemplate.name,
        category: bodyData.category ? bodyData.category.trim() : existingTemplate.category,
        fileName: bodyData.fileName ? bodyData.fileName.trim() : existingTemplate.fileName,
        templateKey: bodyData.fileName ? bodyData.fileName.trim() : existingTemplate.templateKey, // Sync templateKey
        thumbnailUrl,
        customFields
    };

    // 5. Save via repository
    return await templateRepository.updateTemplateById(id, updateData);
};