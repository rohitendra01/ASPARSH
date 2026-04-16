    ; __append("<!DOCTYPE html>\r\n<html lang=\"en\">\r\n\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>\r\n        ")
    ; __line = 8
    ; __append(escapeFn( card.profile?.fullName || 'Digital Profile' ))
    ; __append(" - ")
    ; __append(escapeFn( card.profile?.designation || '' ))
    ; __append("\r\n    </title>\r\n    <meta name=\"description\" content=\"")
    ; __line = 10
    ; __append(escapeFn( card.profile?.bio || 'Digital Business Card' ))
    ; __append("\">\r\n\r\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\r\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\r\n    <link\r\n        href=\"https://fonts.googleapis.com/css2?family=")
    ; __line = 15
    ; __append(escapeFn( card.theme?.fontStyle || 'Inter' ))
    ; __append(":wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&display=swap\"\r\n        rel=\"stylesheet\">\r\n    <link href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\" rel=\"stylesheet\">\r\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js\"></script>\r\n\r\n    <style>\r\n        :root {\r\n            --primary-blue: ")
    ; __line = 22
    ; __append(escapeFn(card.theme?.primaryColor || '#1e40af' ))
    ; __append(";\r\n            --secondary-teal: ")
    ; __line = 23
    ; __append(escapeFn(card.theme?.secondaryColor || '#0891b2' ))
    ; __append(";\r\n            --primary-light: #3b82f6;\r\n            --accent-green: #10b981;\r\n            --light-blue: #eff6ff;\r\n            --neutral-50: #fafafa;\r\n            --neutral-100: #f5f5f5;\r\n            --neutral-200: #e5e5e5;\r\n            --neutral-300: #d4d4d4;\r\n            --neutral-500: #737373;\r\n            --neutral-600: #525252;\r\n            --neutral-700: #404040;\r\n            --neutral-800: #262626;\r\n            --white: #ffffff;\r\n            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);\r\n            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\r\n            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\r\n            --border-radius: 16px;\r\n            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\r\n            --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-teal) 100%);\r\n            --gradient-light: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #f0f9ff 100%);\r\n        }\r\n\r\n        * {\r\n            margin: 0;\r\n            padding: 0;\r\n            box-sizing: border-box;\r\n        }\r\n\r\n        html {\r\n            scroll-behavior: smooth;\r\n        }\r\n\r\n        body {\r\n            font-family: '")
    ; __line = 56
    ; __append(escapeFn( card.theme?.fontStyle || "Inter" ))
    ; __append("', sans-serif;\r\n            line-height: 1.6;\r\n            color: var(--neutral-700);\r\n            background: var(--gradient-light);\r\n            overflow-x: hidden;\r\n            position: relative;\r\n            /* Global text wrapping for resilience */\r\n            overflow-wrap: break-word;\r\n            word-wrap: break-word;\r\n        }\r\n\r\n        /* Background Design */\r\n        body::before {\r\n            content: '';\r\n            position: fixed;\r\n            top: 0;\r\n            left: 0;\r\n            right: 0;\r\n            bottom: 0;\r\n            background: radial-gradient(circle at 20% 30%, rgba(30, 64, 175, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(8, 145, 178, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%), linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #f0f9ff 100%);\r\n            z-index: -2;\r\n        }\r\n\r\n        .container {\r\n            max-width: 100%;\r\n            margin: 0 auto;\r\n            padding: 0 1rem;\r\n        }\r\n\r\n        .section {\r\n            padding: 2rem 0;\r\n            margin: 0 1rem;\r\n        }\r\n\r\n        /* Typography & Headings */\r\n        .hero-title {\r\n            font-family: 'Merriweather', serif;\r\n            font-size: 2.5rem;\r\n            font-weight: 700;\r\n            color: var(--primary-blue);\r\n            margin-bottom: 0.5rem;\r\n            line-height: 1.2;\r\n        }\r\n\r\n        .hero-subtitle {\r\n            font-size: 1.1rem;\r\n            color: var(--neutral-600);\r\n            font-weight: 500;\r\n        }\r\n\r\n        .hero-description {\r\n            font-size: 1rem;\r\n            color: var(--neutral-600);\r\n            margin: 1rem auto;\r\n            line-height: 1.6;\r\n            max-width: 600px;\r\n        }\r\n\r\n        .section-title {\r\n            font-family: 'Merriweather', serif;\r\n            font-size: 1.6rem;\r\n            font-weight: 700;\r\n            color: var(--neutral-800);\r\n            margin-bottom: 1rem;\r\n            text-align: center;\r\n        }\r\n\r\n        .section-description {\r\n            text-align: center;\r\n            color: var(--neutral-600);\r\n            margin-bottom: 1.5rem;\r\n            font-size: 0.95rem;\r\n        }\r\n\r\n        /* Hero Section */\r\n        .hero {\r\n            min-height: 100vh;\r\n            display: flex;\r\n            align-items: center;\r\n            position: relative;\r\n            padding: 2rem 0;\r\n        }\r\n\r\n        .hero-content {\r\n            display: flex;\r\n            flex-direction: column;\r\n            align-items: center;\r\n            text-align: center;\r\n            gap: 1.5rem;\r\n            width: 100%;\r\n        }\r\n\r\n        .profile-image {\r\n            width: 200px;\r\n            height: 200px;\r\n            border-radius: 25%;\r\n            background-size: cover;\r\n            background-position: center;\r\n            border: 3px solid var(--white);\r\n            box-shadow: 0 20px 40px rgba(30, 64, 175, 0.2), 0 0 0 8px rgba(255, 255, 255, 0.8);\r\n            transition: transform 0.3s ease;\r\n        }\r\n\r\n        .profile-image:hover {\r\n            transform: scale(1.05);\r\n        }\r\n\r\n        /* Stats (Hero & Dedicated) */\r\n        .hero-stats {\r\n            display: flex;\r\n            gap: 1rem;\r\n            margin-bottom: 1.5rem;\r\n            flex-wrap: wrap;\r\n            justify-content: center;\r\n        }\r\n\r\n        .stat {\r\n            text-align: center;\r\n            background: var(--white);\r\n            padding: 1rem;\r\n            border-radius: 12px;\r\n            box-shadow: var(--shadow-md);\r\n            min-width: 90px;\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        .stat-number {\r\n            font-size: 1.8rem;\r\n            font-weight: 700;\r\n            color: var(--primary-blue);\r\n            line-height: 1;\r\n        }\r\n\r\n        .stat-label {\r\n            font-size: 0.75rem;\r\n            color: var(--neutral-500);\r\n            margin-top: 0.4rem;\r\n            font-weight: 500;\r\n        }\r\n\r\n        .stats-section {\r\n            background: var(--white);\r\n            margin: 1rem;\r\n            padding: 1.5rem;\r\n            border-radius: var(--border-radius);\r\n            box-shadow: var(--shadow-lg);\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        .stats-grid {\r\n            display: grid;\r\n            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));\r\n            gap: 1rem;\r\n        }\r\n\r\n        .stat-item {\r\n            text-align: center;\r\n            padding: 1.5rem 1rem;\r\n            background: var(--light-blue);\r\n            border-radius: 12px;\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        /* Buttons & Socials */\r\n        .action-buttons {\r\n            display: flex;\r\n            gap: 0.8rem;\r\n            justify-content: center;\r\n            width: 100%;\r\n            max-width: 400px;\r\n        }\r\n\r\n        .action-btn {\r\n            flex: 1;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            gap: 0.5rem;\r\n            background: var(--white);\r\n            color: var(--primary-blue);\r\n            border: 2px solid var(--primary-blue);\r\n            padding: 0.9rem 1.2rem;\r\n            border-radius: 25px;\r\n            font-size: 0.9rem;\r\n            font-weight: 600;\r\n            cursor: pointer;\r\n            transition: var(--transition);\r\n            text-decoration: none;\r\n            box-shadow: var(--shadow-md);\r\n        }\r\n\r\n        .action-btn:hover {\r\n            background: var(--primary-blue);\r\n            color: var(--white);\r\n            transform: translateY(-2px);\r\n        }\r\n\r\n        .social-links {\r\n            display: flex;\r\n            gap: 1rem;\r\n            justify-content: center;\r\n            flex-wrap: wrap;\r\n        }\r\n\r\n        .social-links a {\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            width: 45px;\r\n            height: 45px;\r\n            background: var(--white);\r\n            color: var(--primary-blue);\r\n            border-radius: 50%;\r\n            text-decoration: none;\r\n            transition: var(--transition);\r\n            box-shadow: var(--shadow-sm);\r\n            border: 1px solid var(--neutral-200);\r\n            font-size: 1.2rem;\r\n        }\r\n\r\n        .social-links a:hover {\r\n            background: var(--primary-blue);\r\n            color: var(--white);\r\n            transform: translateY(-2px);\r\n        }\r\n\r\n        /* Contact Details */\r\n        .contact-details-card {\r\n            background: var(--white);\r\n            margin: 1.5rem 1rem;\r\n            padding: 1.5rem;\r\n            border-radius: var(--border-radius);\r\n            box-shadow: var(--shadow-lg);\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        .contact-item {\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 1rem;\r\n            margin-bottom: 1rem;\r\n            padding: 1rem;\r\n            background: var(--neutral-50);\r\n            border-radius: 12px;\r\n            transition: var(--transition);\r\n            text-decoration: none;\r\n            color: inherit;\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        .contact-item:hover {\r\n            background: var(--light-blue);\r\n            transform: translateY(-1px);\r\n        }\r\n\r\n        .contact-icon {\r\n            width: 45px;\r\n            height: 45px;\r\n            background: var(--gradient-primary);\r\n            border-radius: 50%;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            font-size: 1.1rem;\r\n            color: var(--white);\r\n            flex-shrink: 0;\r\n        }\r\n\r\n        .contact-info {\r\n            flex: 1;\r\n            min-width: 0;\r\n            /* Crucial for text truncation/wrapping in flex items */\r\n        }\r\n\r\n        .contact-label {\r\n            font-size: 0.8rem;\r\n            color: var(--neutral-500);\r\n            margin-bottom: 0.2rem;\r\n            font-weight: 600;\r\n        }\r\n\r\n        .contact-value {\r\n            font-size: 0.95rem;\r\n            color: var(--neutral-800);\r\n            font-weight: 500;\r\n        }\r\n\r\n        /* Content Grids (Services, Specializations, Experience) */\r\n        .grid-layout {\r\n            display: grid;\r\n            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\r\n            gap: 1.5rem;\r\n        }\r\n\r\n        .content-card {\r\n            background: var(--white);\r\n            border-radius: var(--border-radius);\r\n            padding: 1.5rem;\r\n            box-shadow: var(--shadow-md);\r\n            border: 1px solid var(--neutral-200);\r\n            transition: var(--transition);\r\n            display: flex;\r\n            flex-direction: column;\r\n            gap: 1rem;\r\n        }\r\n\r\n        .content-card:hover {\r\n            transform: translateY(-3px);\r\n            box-shadow: var(--shadow-lg);\r\n            border-color: var(--primary-blue);\r\n        }\r\n\r\n        .card-icon {\r\n            width: 55px;\r\n            height: 55px;\r\n            background: var(--gradient-primary);\r\n            border-radius: 12px;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            color: var(--white);\r\n            font-size: 1.5rem;\r\n            flex-shrink: 0;\r\n        }\r\n\r\n        .card-text h3 {\r\n            color: var(--neutral-800);\r\n            font-size: 1.1rem;\r\n            font-weight: 700;\r\n            margin-bottom: 0.5rem;\r\n        }\r\n\r\n        .card-text p {\r\n            color: var(--neutral-600);\r\n            font-size: 0.9rem;\r\n            line-height: 1.6;\r\n        }\r\n\r\n        /* Timeline (Experience) */\r\n        .timeline {\r\n            padding-left: 1rem;\r\n            border-left: 2px solid var(--primary-blue);\r\n            margin-left: 1rem;\r\n        }\r\n\r\n        .timeline-item {\r\n            position: relative;\r\n            padding-bottom: 2rem;\r\n            padding-left: 1.5rem;\r\n        }\r\n\r\n        .timeline-item::before {\r\n            content: '';\r\n            position: absolute;\r\n            left: -1.9rem;\r\n            top: 0;\r\n            width: 12px;\r\n            height: 12px;\r\n            background: var(--white);\r\n            border: 3px solid var(--primary-blue);\r\n            border-radius: 50%;\r\n        }\r\n\r\n        /* Lists (Qualifications) */\r\n        .qualifications {\r\n            background: var(--light-blue);\r\n            padding: 1.5rem;\r\n            border-radius: 12px;\r\n            margin-top: 1rem;\r\n        }\r\n\r\n        .qualifications ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .qualifications li {\r\n            padding: 0.4rem 0 0.4rem 1.5rem;\r\n            position: relative;\r\n            color: var(--neutral-700);\r\n            font-weight: 500;\r\n        }\r\n\r\n        .qualifications li::before {\r\n            content: '\\f00c';\r\n            font-family: 'Font Awesome 6 Free';\r\n            font-weight: 900;\r\n            position: absolute;\r\n            left: 0;\r\n            color: var(--accent-green);\r\n        }\r\n\r\n        /* Carousels */\r\n        .carousel-container {\r\n            position: relative;\r\n            overflow: hidden;\r\n            border-radius: var(--border-radius);\r\n            background: var(--white);\r\n            box-shadow: var(--shadow-lg);\r\n            border: 1px solid var(--neutral-200);\r\n        }\r\n\r\n        .carousel-track {\r\n            display: flex;\r\n            transition: transform 0.4s ease;\r\n        }\r\n\r\n        .carousel-slide {\r\n            min-width: 100%;\r\n            padding: 2rem;\r\n        }\r\n\r\n        /* Testimonials */\r\n        .testimonial-text {\r\n            font-size: 1rem;\r\n            color: var(--neutral-600);\r\n            font-style: italic;\r\n            margin-bottom: 1.5rem;\r\n        }\r\n\r\n        .testimonial-author {\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 1rem;\r\n        }\r\n\r\n        .testimonial-avatar {\r\n            width: 50px;\r\n            height: 50px;\r\n            background: var(--gradient-primary);\r\n            border-radius: 50%;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            color: var(--white);\r\n            font-weight: bold;\r\n            overflow: hidden;\r\n        }\r\n\r\n        .testimonial-avatar img {\r\n            width: 100%;\r\n            height: 100%;\r\n            object-fit: cover;\r\n        }\r\n\r\n        .author-info h5 {\r\n            color: var(--neutral-800);\r\n            font-size: 1rem;\r\n        }\r\n\r\n        .author-info p {\r\n            color: var(--primary-blue);\r\n            font-size: 0.85rem;\r\n        }\r\n\r\n        /* Gallery */\r\n        .gallery-slide {\r\n            padding: 0;\r\n            position: relative;\r\n        }\r\n\r\n        .gallery-slide img {\r\n            width: 100%;\r\n            height: 300px;\r\n            object-fit: cover;\r\n            display: block;\r\n        }\r\n\r\n        .gallery-overlay {\r\n            position: absolute;\r\n            bottom: 0;\r\n            left: 0;\r\n            right: 0;\r\n            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));\r\n            color: var(--white);\r\n            padding: 1.5rem;\r\n            text-align: center;\r\n        }\r\n\r\n        .carousel-nav {\r\n            position: absolute;\r\n            top: 50%;\r\n            transform: translateY(-50%);\r\n            background: rgba(255, 255, 255, 0.9);\r\n            color: var(--primary-blue);\r\n            border: none;\r\n            width: 40px;\r\n            height: 40px;\r\n            border-radius: 50%;\r\n            cursor: pointer;\r\n            transition: var(--transition);\r\n            box-shadow: var(--shadow-md);\r\n            z-index: 10;\r\n        }\r\n\r\n        .carousel-nav:hover {\r\n            background: var(--primary-blue);\r\n            color: var(--white);\r\n        }\r\n\r\n        .carousel-nav.prev {\r\n            left: 10px;\r\n        }\r\n\r\n        .carousel-nav.next {\r\n            right: 10px;\r\n        }\r\n\r\n        .carousel-dots {\r\n            display: flex;\r\n            justify-content: center;\r\n            gap: 0.5rem;\r\n            padding: 1rem;\r\n            background: var(--white);\r\n            border-top: 1px solid var(--neutral-100);\r\n        }\r\n\r\n        .dot {\r\n            width: 8px;\r\n            height: 8px;\r\n            border-radius: 50%;\r\n            background: var(--neutral-300);\r\n            cursor: pointer;\r\n            transition: var(--transition);\r\n        }\r\n\r\n        .dot.active {\r\n            background: var(--primary-blue);\r\n            transform: scale(1.2);\r\n        }\r\n\r\n        .screenshot-area {\r\n            background: var(--gradient-light);\r\n            padding-bottom: 2rem;\r\n        }\r\n\r\n        .back-to-top {\r\n            position: fixed;\r\n            bottom: 1rem;\r\n            right: 1rem;\r\n            width: 50px;\r\n            height: 50px;\r\n            background: var(--gradient-primary);\r\n            color: var(--white);\r\n            border: none;\r\n            border-radius: 50%;\r\n            cursor: pointer;\r\n            opacity: 0;\r\n            visibility: hidden;\r\n            transition: var(--transition);\r\n            z-index: 1000;\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            font-size: 1.2rem;\r\n            box-shadow: var(--shadow-lg);\r\n        }\r\n\r\n        .back-to-top.visible {\r\n            opacity: 1;\r\n            visibility: visible;\r\n        }\r\n\r\n        @media (max-width: 768px) {\r\n            .hero-title {\r\n                font-size: 2.2rem;\r\n            }\r\n\r\n            .grid-layout {\r\n                grid-template-columns: 1fr;\r\n            }\r\n        }\r\n    </style>\r\n</head>\r\n\r\n<body>\r\n    <div class=\"screenshot-area\" id=\"capture-area\">\r\n\r\n        <section class=\"hero\">\r\n            <div class=\"container\">\r\n                <div class=\"hero-content\">\r\n                    <div class=\"profile-image\"\r\n                        style=\"background-image: url('")
    ; __line = 637
    ; __append(escapeFn( card.profile?.profileImage || 'https://via.placeholder.com/200' 
))
    ; __append("')\">\r\n                    </div>\r\n\r\n                    <div class=\"hero-text\">\r\n                        <h1 class=\"hero-title\">\r\n                            ")
    ; __line = 642
    ; __append(escapeFn( card.profile?.fullName || 'Professional Profile' ))
    ; __append("\r\n                        </h1>\r\n                        <p class=\"hero-subtitle\">\r\n                            ")
    ; __line = 645
    ; __append(escapeFn( card.profile?.designation || '' ))
    ; __append("\r\n                                ")
    ; __line = 646
    ; __append(escapeFn( card.profile?.companyName ? `| ${card.profile.companyName}` : '' ))
    ; __append("\r\n                        </p>\r\n\r\n                        ")
    ; __line = 649
    ;  if(card.profile?.bio) { 
    ; __append("\r\n                            <p class=\"hero-description\">\r\n                                ")
    ; __line = 651
    ; __append(escapeFn( card.profile.bio ))
    ; __append("\r\n                            </p>\r\n                            ")
    ; __line = 653
    ;  } 
    ; __append("\r\n\r\n                                ")
    ; __line = 655
    ;  if(typeof card.heroStats !=='undefined' && Array.isArray(card.heroStats) &&
                                    card.heroStats.length> 0) { 
    ; __line = 656
    ; __append("\r\n                                    <div class=\"hero-stats\">\r\n                                        ")
    ; __line = 658
    ;  card.heroStats.forEach(stat=> { 
    ; __append("\r\n                                            <div class=\"stat\">\r\n                                                <div class=\"stat-number\">\r\n                                                    ")
    ; __line = 661
    ; __append(escapeFn( stat.value ))
    ; __append("\r\n                                                </div>\r\n                                                <div class=\"stat-label\">\r\n                                                    ")
    ; __line = 664
    ; __append(escapeFn( stat.label ))
    ; __append("\r\n                                                </div>\r\n                                            </div>\r\n                                            ")
    ; __line = 667
    ;  }); 
    ; __append("\r\n                                    </div>\r\n                                    ")
    ; __line = 669
    ;  } 
    ; __append("\r\n                    </div>\r\n\r\n                    <div class=\"action-buttons\">\r\n                        <button class=\"action-btn\" onclick=\"saveContact()\">\r\n                            <i class=\"fas fa-address-card\"></i> Save Contact\r\n                        </button>\r\n                        <button class=\"action-btn\" onclick=\"takeScreenshot()\"\r\n                            style=\"background: var(--primary-blue); color: var(--white);\">\r\n                            <i class=\"fas fa-share-nodes\"></i> Share Profile\r\n                        </button>\r\n                    </div>\r\n\r\n                    ")
    ; __line = 682
    ;  if(typeof card.socials !=='undefined' && Array.isArray(card.socials) && card.socials.length> 0) {
                        
    ; __line = 683
    ; __append("\r\n                        <div class=\"social-links\">\r\n                            ")
    ; __line = 685
    ;  card.socials.forEach(social=> { 
    ; __append("\r\n                                <a href=\"")
    ; __line = 686
    ; __append(escapeFn( social.url ))
    ; __append("\" target=\"_blank\" title=\"")
    ; __append(escapeFn( social.platform ))
    ; __append("\">\r\n                                    <i class=\"")
    ; __line = 687
    ; __append(escapeFn( social.icon || 'fas fa-link' ))
    ; __append("\"></i>\r\n                                </a>\r\n                                ")
    ; __line = 689
    ;  }); 
    ; __append("\r\n                        </div>\r\n                        ")
    ; __line = 691
    ;  } 
    ; __append("\r\n                </div>\r\n            </div>\r\n        </section>\r\n\r\n        ")
    ; __line = 696
    ;  if(card.contact) { 
    ; __append("\r\n            <div class=\"container\">\r\n                <div class=\"contact-details-card\">\r\n                    <h3 class=\"section-title\" style=\"font-size: 1.4rem; margin-bottom: 1.5rem;\">Contact Information</h3>\r\n\r\n                    ")
    ; __line = 701
    ;  if(card.contact.primaryPhone) { 
    ; __append("\r\n                        <a href=\"tel:")
    ; __line = 702
    ; __append(escapeFn( card.contact.primaryPhone ))
    ; __append("\" class=\"contact-item\">\r\n                            <div class=\"contact-icon\"><i class=\"fas fa-phone\"></i></div>\r\n                            <div class=\"contact-info\">\r\n                                <div class=\"contact-label\">Primary Phone</div>\r\n                                <div class=\"contact-value\">\r\n                                    ")
    ; __line = 707
    ; __append(escapeFn( card.contact.primaryPhone ))
    ; __append("\r\n                                </div>\r\n                            </div>\r\n                        </a>\r\n                        ")
    ; __line = 711
    ;  } 
    ; __append("\r\n\r\n                            ")
    ; __line = 713
    ;  if(card.contact.primaryEmail) { 
    ; __append("\r\n                                <a href=\"mailto:")
    ; __line = 714
    ; __append(escapeFn( card.contact.primaryEmail ))
    ; __append("\" class=\"contact-item\">\r\n                                    <div class=\"contact-icon\"><i class=\"fas fa-envelope\"></i></div>\r\n                                    <div class=\"contact-info\">\r\n                                        <div class=\"contact-label\">Email Address</div>\r\n                                        <div class=\"contact-value\">\r\n                                            ")
    ; __line = 719
    ; __append(escapeFn( card.contact.primaryEmail ))
    ; __append("\r\n                                        </div>\r\n                                    </div>\r\n                                </a>\r\n                                ")
    ; __line = 723
    ;  } 
    ; __append("\r\n\r\n                                    ")
    ; __line = 725
    ;  if(card.contact.location && card.contact.location.address) { 
    ; __append("\r\n                                        <a href=\"")
    ; __line = 726
    ; __append(escapeFn( card.contact.location.mapEmbedUrl || '#' ))
    ; __append("\" target=\"_blank\"\r\n                                            class=\"contact-item\">\r\n                                            <div class=\"contact-icon\"><i class=\"fas fa-map-marker-alt\"></i></div>\r\n                                            <div class=\"contact-info\">\r\n                                                <div class=\"contact-label\">Location</div>\r\n                                                <div class=\"contact-value\">\r\n                                                    ")
    ; __line = 732
    ; __append(escapeFn( card.contact.location.address ))
    ; __append("\r\n                                                </div>\r\n                                            </div>\r\n                                        </a>\r\n                                        ")
    ; __line = 736
    ;  } 
    ; __append("\r\n\r\n                                            ")
    ; __line = 738
    ;  if(card.contact.businessHours) { 
    ; __append("\r\n                                                <div class=\"contact-item\">\r\n                                                    <div class=\"contact-icon\"><i class=\"fas fa-clock\"></i></div>\r\n                                                    <div class=\"contact-info\">\r\n                                                        <div class=\"contact-label\">Business Hours</div>\r\n                                                        <div class=\"contact-value\">\r\n                                                            ")
    ; __line = 744
    ; __append(escapeFn( card.contact.businessHours ))
    ; __append("\r\n                                                        </div>\r\n                                                    </div>\r\n                                                </div>\r\n                                                ")
    ; __line = 748
    ;  } 
    ; __append("\r\n\r\n                                                    ")
    ; __line = 750
    ;  if(typeof card.contact.additionalContacts !=='undefined' &&
                                                        Array.isArray(card.contact.additionalContacts) &&
                                                        card.contact.additionalContacts.length> 0) { 
    ; __line = 752
    ; __append("\r\n                                                        ")
    ; __line = 753
    ;  card.contact.additionalContacts.forEach(ac=> { 
    ; __append("\r\n                                                            <a href=\"")
    ; __line = 754
    ; __append(escapeFn( ac.link || '#' ))
    ; __append("\" target=\"_blank\"\r\n                                                                class=\"contact-item\">\r\n                                                                <div class=\"contact-icon\"><i\r\n                                                                        class=\"")
    ; __line = 757
    ; __append(escapeFn( ac.icon || 'fas fa-link' ))
    ; __append("\"></i>\r\n                                                                </div>\r\n                                                                <div class=\"contact-info\">\r\n                                                                    <div class=\"contact-label\">\r\n                                                                        ")
    ; __line = 761
    ; __append(escapeFn( ac.platform ))
    ; __append("\r\n                                                                    </div>\r\n                                                                    <div class=\"contact-value\">\r\n                                                                        ")
    ; __line = 764
    ; __append(escapeFn( ac.value ))
    ; __append("\r\n                                                                    </div>\r\n                                                                </div>\r\n                                                            </a>\r\n                                                            ")
    ; __line = 768
    ;  }); 
    ; __append("\r\n                                                                ")
    ; __line = 769
    ;  } 
    ; __append("\r\n                </div>\r\n            </div>\r\n            ")
    ; __line = 772
    ;  } 
    ; __append("\r\n\r\n                ")
    ; __line = 774
    ;  if(typeof card.stats !=='undefined' && Array.isArray(card.stats) && card.stats.length> 0) { 
    ; __append("\r\n                    <section class=\"section container\">\r\n                        <div class=\"stats-section\">\r\n                            <h2 class=\"section-title\">\r\n                                ")
    ; __line = 778
    ; __append(escapeFn( card.theme?.sectionTitles?.stats || 'Highlights & Excellence' ))
    ; __append("\r\n                            </h2>\r\n                            <div class=\"stats-grid\">\r\n                                ")
    ; __line = 781
    ;  card.stats.forEach(stat=> { 
    ; __append("\r\n                                    <div class=\"stat-item\">\r\n                                        <i class=\"")
    ; __line = 783
    ; __append(escapeFn( stat.icon || 'fas fa-star' ))
    ; __append("\"\r\n                                            style=\"font-size: 1.5rem; color: var(--primary-blue); margin-bottom: 0.5rem;\"></i>\r\n                                        <div class=\"stat-number\">\r\n                                            ")
    ; __line = 786
    ; __append(escapeFn( stat.value ))
    ; __append("\r\n                                        </div>\r\n                                        <div class=\"stat-label\">\r\n                                            ")
    ; __line = 789
    ; __append(escapeFn( stat.label ))
    ; __append("\r\n                                        </div>\r\n                                    </div>\r\n                                    ")
    ; __line = 792
    ;  }); 
    ; __append("\r\n                            </div>\r\n                        </div>\r\n                    </section>\r\n                    ")
    ; __line = 796
    ;  } 
    ; __append("\r\n\r\n                        ")
    ; __line = 798
    ;  if(card.profile?.bio || (typeof card.qualifications !=='undefined' &&
                            Array.isArray(card.qualifications) && card.qualifications.length> 0)) { 
    ; __line = 799
    ; __append("\r\n                            <section class=\"section container\">\r\n                                <h2 class=\"section-title\">About</h2>\r\n                                <div class=\"contact-details-card\" style=\"margin: 0;\">\r\n                                    ")
    ; __line = 803
    ;  if(card.profile?.bio) { 
    ; __append("\r\n                                        <p style=\"color: var(--neutral-600); margin-bottom: 1.5rem;\">\r\n                                            ")
    ; __line = 805
    ; __append(escapeFn( card.profile.bio ))
    ; __append("\r\n                                        </p>\r\n                                        ")
    ; __line = 807
    ;  } 
    ; __append("\r\n\r\n                                            ")
    ; __line = 809
    ;  if(typeof card.qualifications !=='undefined' &&
                                                Array.isArray(card.qualifications) && card.qualifications.length> 0) {
                                                
    ; __line = 811
    ; __append("\r\n                                                <div class=\"qualifications\">\r\n                                                    <h4\r\n                                                        style=\"color: var(--neutral-800); margin-bottom: 1rem; font-size: 1.1rem;\">\r\n                                                        Credentials & Qualifications</h4>\r\n                                                    <ul>\r\n                                                        ")
    ; __line = 817
    ;  card.qualifications.forEach(qual=> { 
    ; __append("\r\n                                                            <li>\r\n                                                                ")
    ; __line = 819
    ; __append(escapeFn( qual ))
    ; __append("\r\n                                                            </li>\r\n                                                            ")
    ; __line = 821
    ;  }); 
    ; __append("\r\n                                                    </ul>\r\n                                                </div>\r\n                                                ")
    ; __line = 824
    ;  } 
    ; __append("\r\n                                </div>\r\n                            </section>\r\n                            ")
    ; __line = 827
    ;  } 
    ; __append("\r\n\r\n                                ")
    ; __line = 829
    ;  if(typeof card.services !=='undefined' && Array.isArray(card.services) &&
                                    card.services.length> 0) { 
    ; __line = 830
    ; __append("\r\n                                    <section class=\"section container\">\r\n                                        <h2 class=\"section-title\">\r\n                                            ")
    ; __line = 833
    ; __append(escapeFn( card.theme?.sectionTitles?.services || 'Our Services' ))
    ; __append("\r\n                                        </h2>\r\n\r\n                                        ")
    ; __line = 836
    ;  if(card.theme?.sectionDescriptions?.services) { 
    ; __append("\r\n                                            <p class=\"section-description\">\r\n                                                ")
    ; __line = 838
    ; __append(escapeFn( card.theme.sectionDescriptions.services ))
    ; __append("\r\n                                            </p>\r\n                                            ")
    ; __line = 840
    ;  } 
    ; __append("\r\n\r\n                                                <div class=\"grid-layout\">\r\n                                                    ")
    ; __line = 843
    ;  card.services.forEach(service=> { 
    ; __append("\r\n                                                        <div class=\"content-card\">\r\n                                                            <div style=\"display: flex; align-items: center; gap: 1rem;\">\r\n                                                                <div class=\"card-icon\"><i\r\n                                                                        class=\"")
    ; __line = 847
    ; __append(escapeFn( service.icon || 'fas fa-stethoscope' ))
    ; __append("\"></i>\r\n                                                                </div>\r\n                                                                <h3\r\n                                                                    style=\"color: var(--neutral-800); font-weight: 700;\">\r\n                                                                    ")
    ; __line = 851
    ; __append(escapeFn( service.title ))
    ; __append("\r\n                                                                </h3>\r\n                                                            </div>\r\n                                                            ")
    ; __line = 854
    ;  if(service.description) { 
    ; __append("\r\n                                                                <p style=\"color: var(--neutral-600);\">\r\n                                                                    ")
    ; __line = 856
    ; __append(escapeFn( service.description ))
    ; __append("\r\n                                                                </p>\r\n                                                                ")
    ; __line = 858
    ;  } 
    ; __append("\r\n                                                        </div>\r\n                                                        ")
    ; __line = 860
    ;  }); 
    ; __append("\r\n                                                </div>\r\n                                    </section>\r\n                                    ")
    ; __line = 863
    ;  } 
    ; __append("\r\n\r\n                                        ")
    ; __line = 865
    ;  if(typeof card.specializations !=='undefined' &&
                                            Array.isArray(card.specializations) && card.specializations.length> 0) { 
    ; __line = 866
    ; __append("\r\n                                            <section class=\"section container\">\r\n                                                <h2 class=\"section-title\">Specializations</h2>\r\n                                                <div class=\"grid-layout\">\r\n                                                    ")
    ; __line = 870
    ;  card.specializations.forEach(spec=> { 
    ; __append("\r\n                                                        <div class=\"content-card\"\r\n                                                            style=\"background: var(--gradient-primary); color: var(--white); border: none; text-align: center; align-items: center;\">\r\n                                                            <i class=\"")
    ; __line = 873
    ; __append(escapeFn( spec.icon || 'fas fa-heartbeat' ))
    ; __append("\"\r\n                                                                style=\"font-size: 2.5rem; margin-bottom: 0.5rem;\"></i>\r\n                                                            <h3\r\n                                                                style=\"color: var(--white); font-weight: 700; font-size: 1.2rem;\">\r\n                                                                ")
    ; __line = 877
    ; __append(escapeFn( spec.title ))
    ; __append("\r\n                                                            </h3>\r\n                                                            ")
    ; __line = 879
    ;  if(spec.description) { 
    ; __append("\r\n                                                                <p style=\"color: rgba(255,255,255,0.9);\">\r\n                                                                    ")
    ; __line = 881
    ; __append(escapeFn( spec.description ))
    ; __append("\r\n                                                                </p>\r\n                                                                ")
    ; __line = 883
    ;  } 
    ; __append("\r\n                                                        </div>\r\n                                                        ")
    ; __line = 885
    ;  }); 
    ; __append("\r\n                                                </div>\r\n                                            </section>\r\n                                            ")
    ; __line = 888
    ;  } 
    ; __append("\r\n\r\n                                                ")
    ; __line = 890
    ;  if(typeof card.experience !=='undefined' &&
                                                    Array.isArray(card.experience) && card.experience.length> 0) { 
    ; __line = 891
    ; __append("\r\n                                                    <section class=\"section container\">\r\n                                                        <h2 class=\"section-title\">\r\n                                                            ")
    ; __line = 894
    ; __append(escapeFn( card.theme?.sectionTitles?.experience
                                                                || 'Experience & Journey' ))
    ; __line = 895
    ; __append("\r\n                                                        </h2>\r\n                                                        <div class=\"contact-details-card\" style=\"margin: 0;\">\r\n                                                            <div class=\"timeline\">\r\n                                                                ")
    ; __line = 899
    ;  card.experience.forEach(exp=> { 
    ; __append("\r\n                                                                    <div class=\"timeline-item\">\r\n                                                                        <h3\r\n                                                                            style=\"color: var(--neutral-800); font-weight: 700; margin-bottom: 0.3rem;\">\r\n                                                                            ")
    ; __line = 903
    ; __append(escapeFn( exp.title ))
    ; __append("\r\n                                                                        </h3>\r\n                                                                        <div\r\n                                                                            style=\"color: var(--primary-blue); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;\">\r\n                                                                            ")
    ; __line = 907
    ; __append(escapeFn( exp.organization ))
    ; __append(" | ")
    ; __append(escapeFn( exp.duration
                                                                                    ))
    ; __line = 908
    ; __append("\r\n                                                                        </div>\r\n                                                                        ")
    ; __line = 910
    ;  if(exp.description) { 
    ; __append("\r\n                                                                            <p style=\"color: var(--neutral-600);\">\r\n                                                                                ")
    ; __line = 912
    ; __append(escapeFn( exp.description ))
    ; __append("\r\n                                                                            </p>\r\n                                                                            ")
    ; __line = 914
    ;  } 
    ; __append("\r\n                                                                    </div>\r\n                                                                    ")
    ; __line = 916
    ;  }); 
    ; __append("\r\n                                                            </div>\r\n                                                        </div>\r\n                                                    </section>\r\n                                                    ")
    ; __line = 920
    ;  } 
    ; __append("\r\n\r\n                                                        ")
    ; __line = 922
    ;  if(typeof card.testimonials !=='undefined' &&
                                                            Array.isArray(card.testimonials) &&
                                                            card.testimonials.length> 0) { 
    ; __line = 924
    ; __append("\r\n                                                            <section class=\"section container\">\r\n                                                                <h2 class=\"section-title\">Client Reviews</h2>\r\n                                                                <div class=\"carousel-container\">\r\n                                                                    <div class=\"carousel-track\" id=\"testimonialsTrack\">\r\n                                                                        ")
    ; __line = 929
    ;  card.testimonials.forEach(test=> { 
    ; __append("\r\n                                                                            <div class=\"carousel-slide\">\r\n                                                                                <i class=\"fas fa-quote-left\"\r\n                                                                                    style=\"font-size: 2rem; color: var(--primary-light); opacity: 0.2; margin-bottom: 1rem; display: block;\"></i>\r\n                                                                                <p class=\"testimonial-text\">\"")
    ; __line = 933
    ; __append(escapeFn(
                                                                                        test.quote ))
    ; __line = 934
    ; __append("\"</p>\r\n                                                                                <div class=\"testimonial-author\">\r\n                                                                                    <div class=\"testimonial-avatar\">\r\n                                                                                        ")
    ; __line = 937
    ;  if(test.avatar) { 
    ; __append("\r\n                                                                                            <img src=\"")
    ; __line = 938
    ; __append(escapeFn( test.avatar ))
    ; __append("\">\r\n                                                                                        ")
    ; __line = 939
    ;  } else { 
    ; __append("\r\n                                                                                            ")
    ; __line = 940
    ; __append(escapeFn( test.clientName.substring(0, 2).toUpperCase() ))
    ; __append("\r\n                                                                                        ")
    ; __line = 941
    ;  } 
    ; __append("\r\n                                                                                    </div>\r\n                                                                                    <div class=\"author-info\">\r\n                                                                                        <h5 style=\"font-weight: 700;\">\r\n                                                                                            ")
    ; __line = 945
    ; __append(escapeFn( test.clientName ))
    ; __append("\r\n                                                                                        </h5>\r\n                                                                                        ")
    ; __line = 947
    ;  if(test.context) { 
    ; __append("\r\n                                                                                            <p>\r\n                                                                                                ")
    ; __line = 949
    ; __append(escapeFn( test.context ))
    ; __append("\r\n                                                                                            </p>\r\n                                                                                            ")
    ; __line = 951
    ;  } 
    ; __append("\r\n                                                                                    </div>\r\n                                                                                </div>\r\n                                                                            </div>\r\n                                                                            ")
    ; __line = 955
    ;  }); 
    ; __append("\r\n                                                                    </div>\r\n                                                                    <div class=\"carousel-dots\">\r\n                                                                        ")
    ; __line = 958
    ;  card.testimonials.forEach((_, index)=> { 
    ; __append("\r\n                                                                            <span\r\n                                                                                class=\"dot ")
    ; __line = 960
    ; __append(escapeFn( index === 0 ? 'active' : '' ))
    ; __append("\"\r\n                                                                                onclick=\"moveCarousel('testimonialsTrack', ")
    ; __line = 961
    ; __append(escapeFn( index ))
    ; __append(")\"></span>\r\n                                                                            ")
    ; __line = 962
    ;  }); 
    ; __append("\r\n                                                                    </div>\r\n                                                                </div>\r\n                                                            </section>\r\n                                                            ")
    ; __line = 966
    ;  } 
    ; __append("\r\n\r\n                                                                ")
    ; __line = 968
    ;  if(typeof card.gallery !=='undefined' &&
                                                                    Array.isArray(card.gallery) && card.gallery.length>
                                                                    0) { 
    ; __line = 970
    ; __append("\r\n                                                                    <section class=\"section container\">\r\n                                                                        <h2 class=\"section-title\">\r\n                                                                            ")
    ; __line = 973
    ; __append(escapeFn( card.theme?.sectionTitles?.gallery
                                                                                || 'Gallery' ))
    ; __line = 974
    ; __append("\r\n                                                                        </h2>\r\n                                                                        <div class=\"carousel-container\"\r\n                                                                            style=\"position: relative;\">\r\n                                                                            <div class=\"carousel-track\"\r\n                                                                                id=\"galleryTrack\">\r\n                                                                                ")
    ; __line = 980
    ;  card.gallery.forEach(img=> { 
    ; __append("\r\n                                                                                    <div\r\n                                                                                        class=\"carousel-slide gallery-slide\">\r\n                                                                                        <img src=\"")
    ; __line = 983
    ; __append(escapeFn( img.image ))
    ; __append("\"\r\n                                                                                            alt=\"")
    ; __line = 984
    ; __append(escapeFn( img.title || 'Gallery Image' ))
    ; __append("\">\r\n                                                                                        ")
    ; __line = 985
    ;  if(img.title) { 
    ; __append("\r\n                                                                                            <div\r\n                                                                                                class=\"gallery-overlay\">\r\n                                                                                                <h4>\r\n                                                                                                    ")
    ; __line = 989
    ; __append(escapeFn( img.title ))
    ; __append("\r\n                                                                                                </h4>\r\n                                                                                            </div>\r\n                                                                                            ")
    ; __line = 992
    ;  } 
    ; __append("\r\n                                                                                    </div>\r\n                                                                                    ")
    ; __line = 994
    ;  }); 
    ; __append("\r\n                                                                            </div>\r\n                                                                            <button class=\"carousel-nav prev\"\r\n                                                                                onclick=\"shiftGallery(-1)\"><i\r\n                                                                                    class=\"fas fa-chevron-left\"></i></button>\r\n                                                                            <button class=\"carousel-nav next\"\r\n                                                                                onclick=\"shiftGallery(1)\"><i\r\n                                                                                    class=\"fas fa-chevron-right\"></i></button>\r\n                                                                            <div class=\"carousel-dots\">\r\n                                                                                ")
    ; __line = 1003
    ;  card.gallery.forEach((_, index)=> {
                                                                                    
    ; __line = 1004
    ; __append("\r\n                                                                                    <span\r\n                                                                                        class=\"dot ")
    ; __line = 1006
    ; __append(escapeFn( index === 0 ? 'active' : '' ))
    ; __append("\"\r\n                                                                                        onclick=\"moveCarousel('galleryTrack', ")
    ; __line = 1007
    ; __append(escapeFn( index ))
    ; __append(")\"></span>\r\n                                                                                    ")
    ; __line = 1008
    ;  }); 
    ; __append("\r\n                                                                            </div>\r\n                                                                        </div>\r\n                                                                    </section>\r\n                                                                    ")
    ; __line = 1012
    ;  } 
    ; __append("\r\n\r\n    </div> <button class=\"back-to-top\" aria-label=\"Back to top\">\r\n        <i class=\"fas fa-chevron-up\"></i>\r\n    </button>\r\n\r\n    <script>\r\n        // Data Extraction for Scripts\r\n        const cardName = \"")
    ; __line = 1020
    ; __append(escapeFn( card.profile?.fullName || 'Professional' ))
    ; __append("\";\r\n\r\n        // 1. SAVE CONTACT (.vcf)\r\n        function saveContact() {\r\n            const vCardData = \"BEGIN:VCARD\\\\n\" +\r\n                \"VERSION:3.0\\\\n\" +\r\n                \"FN:")
    ; __line = 1026
    ; __append(escapeFn( card.profile?.fullName || '' ))
    ; __append("\\\\n\" +\r\n                \"ORG:")
    ; __line = 1027
    ; __append(escapeFn( card.profile?.companyName || '' ))
    ; __append("\\\\n\" +\r\n                \"TITLE:")
    ; __line = 1028
    ; __append(escapeFn( card.profile?.designation || '' ))
    ; __append("\\\\n\" +\r\n                \"EMAIL:")
    ; __line = 1029
    ; __append(escapeFn( card.contact?.primaryEmail || '' ))
    ; __append("\\\\n\" +\r\n                \"TEL:")
    ; __line = 1030
    ; __append(escapeFn( card.contact?.primaryPhone || '' ))
    ; __append("\\\\n\" +\r\n                \"ADR:;;")
    ; __line = 1031
    ; __append(escapeFn( card.contact?.location?.address || '' ))
    ; __append("\\\\n\" +\r\n                \"URL:")
    ; __line = 1032
    ; __append(escapeFn( card.contact?.website || '' ))
    ; __append("\\\\n\" +\r\n                \"NOTE:")
    ; __line = 1033
    ; __append(escapeFn( card.profile?.bio || '' ))
    ; __append("\\\\n\" +\r\n                \"END:VCARD\";\r\n\r\n            const blob = new Blob([vCardData], { type: \"text/vcard\" });\r\n            const url = window.URL.createObjectURL(blob);\r\n            const link = document.createElement(\"a\");\r\n            link.href = url;\r\n            link.download = `${cardName.replace(/\\s+/g, '_')}_Contact.vcf`;\r\n            link.click();\r\n            window.URL.revokeObjectURL(url);\r\n        }\r\n\r\n        // 2. SCREENSHOT GENERATOR\r\n        function takeScreenshot() {\r\n            const button = event.currentTarget;\r\n            const originalText = button.innerHTML;\r\n            button.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Processing...';\r\n            button.disabled = true;\r\n\r\n            const screenshotArea = document.getElementById('capture-area');\r\n            html2canvas(screenshotArea, {\r\n                useCORS: true,\r\n                scale: 2,\r\n                backgroundColor: null\r\n            }).then(canvas => {\r\n                const link = document.createElement('a');\r\n                link.download = `${cardName.replace(/\\s+/g, \"_\")}_Profile.png`;\r\n                link.href = canvas.toDataURL('image/png');\r\n                link.click();\r\n                button.innerHTML = originalText;\r\n                button.disabled = false;\r\n            }).catch(err => {\r\n                console.error('Screenshot error:', err);\r\n                button.innerHTML = originalText;\r\n                button.disabled = false;\r\n            });\r\n        }\r\n\r\n        // 3. UNIVERSAL CAROUSEL LOGIC\r\n        // Safe variables injected from EJS\r\n        const tCount = ")
    ; __line = 1073
    ; __append(escapeFn( (typeof card.testimonials !== 'undefined' && Array.isArray(card.testimonials)) ? card.testimonials.length : 0 ))
    ; __append(";\r\n        const gCount = ")
    ; __line = 1074
    ; __append(escapeFn( (typeof card.gallery !== 'undefined' && Array.isArray(card.gallery)) ? card.gallery.length : 0 ))
    ; __append(";\r\n\r\n        let state = { testimonialsTrack: 0, galleryTrack: 0 };\r\n\r\n        function moveCarousel(trackId, index) {\r\n            const track = document.getElementById(trackId);\r\n            if (!track) return;\r\n\r\n            const container = track.parentElement;\r\n            const dots = container.querySelectorAll('.carousel-dots .dot');\r\n\r\n            state[trackId] = index;\r\n            track.style.transform = `translateX(-${index * 100}%)`;\r\n\r\n            dots.forEach(d => d.classList.remove('active'));\r\n            if (dots[index]) dots[index].classList.add('active');\r\n        }\r\n\r\n        // Specific shift for gallery arrows\r\n        function shiftGallery(direction) {\r\n            if (gCount === 0) return;\r\n            let newIndex = state.galleryTrack + direction;\r\n            if (newIndex >= gCount) newIndex = 0;\r\n            if (newIndex < 0) newIndex = gCount - 1;\r\n            moveCarousel('galleryTrack', newIndex);\r\n        }\r\n\r\n        // Auto-play Testimonials\r\n        if (tCount > 1) {\r\n            setInterval(() => {\r\n                let newIndex = state.testimonialsTrack + 1;\r\n                if (newIndex >= tCount) newIndex = 0;\r\n                moveCarousel('testimonialsTrack', newIndex);\r\n            }, 5000);\r\n        }\r\n\r\n        // 4. UI INTERACTIVITY\r\n        window.addEventListener('scroll', function () {\r\n            const backToTop = document.querySelector('.back-to-top');\r\n            if (window.scrollY > 300) backToTop.classList.add('visible');\r\n            else backToTop.classList.remove('visible');\r\n        });\r\n\r\n        document.querySelector('.back-to-top').addEventListener('click', function () {\r\n            window.scrollTo({ top: 0, behavior: 'smooth' });\r\n        });\r\n\r\n        // Safe external link opener for contacts\r\n        document.querySelectorAll('.contact-item').forEach(item => {\r\n            item.addEventListener('click', function (e) {\r\n                const href = this.getAttribute('href');\r\n                if (href && href !== '#') {\r\n                    window.open(href, href.startsWith('tel:') || href.startsWith('mailto:') ? '_self' : '_blank');\r\n                }\r\n            });\r\n        });\r\n\r\n        // Fade in on load\r\n        window.addEventListener('load', () => { document.body.style.opacity = '1'; });\r\n        document.body.style.opacity = '0';\r\n        document.body.style.transition = 'opacity 0.5s ease';\r\n    </script>\r\n</body>\r\n\r\n</html>")
    ; __line = 1138
