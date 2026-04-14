exports.getRandomPromptStyle = (businessName, city, category) => {
    const promptStyles = [
        {
            system: `You are a customer writing a 3-7 word review for ${businessName} in ${city}. Your review is extremely short, positive, and to the point. **Do not use any markdown, bolding, or special formatting.**`,
            user: `Generate a 3-7 word positive review (e.g., "Good service.", "Best in ${city}.", "Loved it."). **Plain text only, no markdown.**`
        },
        {
            system: `You are a professional critic reviewing ${businessName} (a ${category}) in ${city}. Your review is articulate and sophisticated. **You must not use any markdown, bolding, or asterisks.**`,
            user: `Generate a 10-30 word professional review. Focus on the unique aspects and why it's a "must-visit" in ${city}. **Write in plain text only.**`
        },
        {
            system: `You are a true local of ${city}. Your review for ${businessName} is deeply rooted in the local culture and language.Use writing in local languae also. **You must not use any markdown, bolding, or formatting.**`,
            user: `Generate a 10-25 word review for ${businessName} that showcases your deep local knowledge. **Plain text only, no markdown.**`
        }
    ];

    return promptStyles[Math.floor(Math.random() * promptStyles.length)];
};