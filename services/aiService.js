const { GoogleGenAI } = require('@google/genai');

let ai;

try {
    if (!process.env.GOOGLE_API_KEY) {
    } else {
        ai = new GoogleGenAI({ 
            apiKey: process.env.GOOGLE_API_KEY 
        });
    }
} catch (error) {
    console.error('[AI Service] Failed to initialize Gemini:', error.message);
}

async function generateReviewText(systemPrompt, userPrompt) {
    try {
        if (!ai || !process.env.GOOGLE_API_KEY) {
            return generateFallbackReview();
        }


        const message = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        const reviewText = message.text.trim();
        if (!reviewText) {
            throw new Error('Empty response from Gemini');
        }
        
        return reviewText;

    } catch (error) {
        console.error('[GenerateReview] Error:', error.message);
        console.log('[GenerateReview] Using fallback template');
        return generateFallbackReview();
    }
}


function generateFallbackReview() {
    const templates = [
        'Excellent service and highly professional. Great attention to detail and customer support. Would definitely recommend!',
        'Outstanding quality and exceptional customer experience. Very satisfied with the results. Thank you!',
        'Professional, reliable, and efficient. Exceeded my expectations. Highly recommended to anyone!',
        'Impressive work quality and excellent customer service. Very happy with the experience. Will come back again!',
        'Great value for money with top-notch quality. Friendly and helpful team. Definitely coming back soon!',
        'Amazing experience from start to finish. Staff was very helpful and professional. Absolutely loved it!',
        'This is exactly what I was looking for. Quality is outstanding and service is top-notch. Highly satisfied!'
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

module.exports = {
    generateReviewText,
    generateFallbackReview
};
