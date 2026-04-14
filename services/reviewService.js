const reviewRepository = require('../repositories/reviewRepository');
const profileRepository = require('../repositories/profileRepository');
const { generateReviewText } = require('./aiService');
const { getRandomPromptStyle } = require('../utils/reviewPromptLibrary');

const generateUniqueSlug = async (profileSlug) => {
    const randomHash = Math.random().toString(36).substring(2, 7);
    let uniqueSlug = `${profileSlug}-${randomHash}`;

    const exists = await reviewRepository.checkSlugExists(uniqueSlug);
    if (exists) return generateUniqueSlug(profileSlug);

    return uniqueSlug;
};

exports.processReviewCreation = async (data, userId) => {
    const { profileSlug, targetUrl, reviewTitle, businessName, businessSubheader, businessCategory } = data;

    const profile = await profileRepository.findProfileBySlug(profileSlug);
    if (!profile) throw new Error('Profile not found');

    const slug = await generateUniqueSlug(profile.slug);

    const reviewLink = await reviewRepository.createReviewLink({
        profileSlug: profile.slug,
        profileId: profile._id,
        slug, targetUrl, businessName, businessSubheader, businessCategory,
        reviewTitle: reviewTitle || 'Share Your Experience',
        isActive: true,
        status: 'active',
        tenantId: userId
    });

    return { reviewLink, slug };
};

exports.getPublicReviewData = async (slug) => {
    const reviewLink = await reviewRepository.findPublicReviewBySlug(slug);
    if (!reviewLink) throw new Error('Review link not found or inactive');

    const profile = await profileRepository.findProfileById(reviewLink.profileId);
    if (!profile) throw new Error('Linked profile not found');

    reviewRepository.incrementViewCount(reviewLink._id).catch(e => console.error('View track error:', e));

    return { reviewLink, city: profile.address?.city };
};

exports.processAiReviewGeneration = async (slug) => {
    const reviewLink = await reviewRepository.incrementGenerationCount(slug);
    if (!reviewLink) throw new Error('Link not found');

    const profile = await profileRepository.findProfileById(reviewLink.profileId);
    const city = profile?.address?.city || 'this area';

    const style = getRandomPromptStyle(reviewLink.businessName, city, reviewLink.businessCategory);

    let systemPrompt = reviewLink.customPromptTemplate ? reviewLink.customPromptTemplate : style.system;
    if (reviewLink.businessSubheader) {
        systemPrompt = `The business, ${reviewLink.businessName}, also specializes in ${reviewLink.businessSubheader}. ${systemPrompt}`;
    }

    const generatedText = await generateReviewText(systemPrompt, style.user);

    reviewRepository.saveGeneratedReview(reviewLink._id, generatedText, reviewLink.businessCategory)
        .catch(e => console.error('Error saving generated review history:', e));

    return { reviewText: generatedText, category: reviewLink.businessCategory };
};

exports.trackReviewSubmission = async (slug) => {
    const result = await reviewRepository.incrementSubmissionCount(slug);
    if (!result) throw new Error('Link not found');
    return true;
};