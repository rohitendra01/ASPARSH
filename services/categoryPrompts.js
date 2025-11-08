const categoryPrompts = {
    healthcare: {
        doctor: {
            system: 'You are a helpful healthcare feedback generator. Generate authentic, specific positive reviews for doctors.',
            template: 'Generate a 2 sentence positive review for a doctor focusing on: professional expertise, patient care, communication skills, and treatment effectiveness. The review should sound natural and authentic.'
        },
        dentist: {
            system: 'You are a helpful healthcare feedback generator for dental services.',
            template: 'Generate a 2 sentence positive review for a dentist highlighting: professional skill, pain management, hygiene standards, and patient comfort. Make it sound genuine and specific to dental care.'
        },
        therapist: {
            system: 'You are a helpful healthcare feedback generator for mental health services.',
            template: 'Generate a 2 sentence positive review for a therapist/counselor emphasizing: listening skills, professionalism, confidentiality, and positive therapeutic outcomes.'
        }
    },
    
    restaurant: {
        fine_dining: {
            system: 'You are a professional food critic generating authentic restaurant reviews.',
            template: 'Generate a 2 sentence positive review for a fine dining restaurant highlighting: food quality, presentation, ambiance, service quality, and overall dining experience.'
        },
        casual_dining: {
            system: 'You are a casual restaurant review generator.',
            template: 'Generate a 2 sentence positive review for a casual restaurant mentioning: food taste and quality, portion size, service quality, value for money, and atmosphere.'
        },
        cafe: {
            system: 'You are a cafe review generator.',
            template: 'Generate a 2 sentence positive review for a cafe focusing on: coffee/beverage quality, ambiance, wifi availability/seating comfort, and staff friendliness.'
        }
    },
    
    retail: {
        clothing: {
            system: 'You are a retail review generator for clothing stores.',
            template: 'Generate a 2 sentence positive review for a clothing store mentioning: product quality, variety of styles and sizes, staff helpfulness, and shopping experience.'
        },
        electronics: {
            system: 'You are a tech retail review generator.',
            template: 'Generate a 2 sentence positive review for an electronics store highlighting: product selection, staff technical expertise, competitive prices, and customer service.'
        },
        bookstore: {
            system: 'You are a bookstore review generator.',
            template: 'Generate a 2 sentence positive review for a bookstore emphasizing: book collection variety, store atmosphere, staff knowledge about books, and customer service.'
        }
    },
    
    services: {
        salon: {
            system: 'You are a salon/beauty service review generator.',
            template: 'Generate a 2 sentence positive review for a salon/spa highlighting: service quality, stylist/therapist expertise, cleanliness and hygiene, and overall experience.'
        },
        fitness: {
            system: 'You are a fitness center review generator.',
            template: 'Generate a 2 sentence positive review for a gym/fitness center mentioning: equipment quality, trainer expertise, cleanliness standards, and class variety.'
        },
        plumbing: {
            system: 'You are a home service review generator.',
            template: 'Generate a 2 sentence positive review for a plumbing service emphasizing: professional expertise, problem-solving efficiency, punctuality, and fair pricing.'
        }
    },
    
    hospitality: {
        hotel: {
            system: 'You are a hotel review generator.',
            template: 'Generate a 2 sentence positive review for a hotel mentioning: room cleanliness and comfort, amenities quality, check-in/check-out experience, and staff service.'
        },
        travel: {
            system: 'You are a travel service review generator.',
            template: 'Generate a 2 sentence positive review for a travel agency/tour company highlighting: service professionalism, itinerary quality, communication, and value for money.'
        }
    },
    
    professional: {
        consulting: {
            system: 'You are a business consulting review generator.',
            template: 'Generate a 2 sentence positive review for a consulting firm emphasizing: industry expertise, quality of solutions provided, communication clarity, and business impact.'
        },
        legal: {
            system: 'You are a legal services review generator.',
            template: 'Generate a 2 sentence positive review for a law firm highlighting: legal expertise, case/matter outcomes, professionalism, and client communication.'
        },
        accounting: {
            system: 'You are an accounting services review generator.',
            template: 'Generate a 2 sentence positive review for an accounting/tax firm mentioning: technical expertise, accuracy in work, professionalism, and responsive support.'
        }
    },
    
    default: {
        default: {
            system: 'You are a helpful review generator. Create authentic, positive feedback.',
            template: 'Generate a 2 sentence positive review highlighting professionalism, service quality, customer satisfaction, and overall positive experience.'
        }
    }
};

function getPromptTemplate(category, subcategory) {
    const cat = (category || '').toLowerCase().trim();
    const subcat = (subcategory || '').toLowerCase().trim();
    
    if (categoryPrompts[cat] && subcat && categoryPrompts[cat][subcat]) {
        console.log(`[Prompts] Using template for ${cat}/${subcat}`);
        return categoryPrompts[cat][subcat];
    }
    
    if (categoryPrompts[cat]) {
        const keys = Object.keys(categoryPrompts[cat]);
        if (keys.length > 0) {
            console.log(`[Prompts] Using first template for ${cat}`);
            return categoryPrompts[cat][keys[0]];
        }
    }
    
    console.warn(`[Prompts] Category "${cat}" not found, using default template`);
    return categoryPrompts.default.default;
}

function getAvailableCategories() {
    const categories = {};
    Object.keys(categoryPrompts).forEach(cat => {
        if (cat !== 'default') {
            categories[cat] = Object.keys(categoryPrompts[cat]);
        }
    });
    return categories;
}

module.exports = {
    categoryPrompts,
    getPromptTemplate,
    getAvailableCategories
};
