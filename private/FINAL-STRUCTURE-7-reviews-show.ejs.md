<!-- views/reviews/show.ejs - PUBLIC CUSTOMER PAGE (BEAUTIFUL) -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review - <%= business.name %></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 650px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .category-badge {
            text-align: center;
            color: #667eea;
            font-size: 12px;
            margin-bottom: 30px;
            font-weight: 600;
        }
        
        .review-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            min-height: 150px;
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
        }
        
        .review-box.loading {
            display: flex;
            justify-content: center;
            align-items: center;
            color: #999;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        button {
            flex: 1;
            min-width: 140px;
            padding: 15px 20px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-regenerate {
            background: #667eea;
            color: white;
        }
        
        .btn-regenerate:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }
        
        .btn-copy {
            background: #48bb78;
            color: white;
        }
        
        .btn-copy:hover {
            background: #38a169;
            transform: translateY(-2px);
        }
        
        .btn-copy.copied {
            background: #2f855a;
        }
        
        .btn-submit {
            background: #ed8936;
            color: white;
        }
        
        .btn-submit:hover {
            background: #dd6b20;
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 22px;
            }
            
            button {
                min-width: 120px;
                padding: 12px 15px;
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 <%= link.title %></h1>
        <p class="subtitle">Review for <%= business.name %></p>
        <p class="category-badge">📂 <%= business.category %> • <%= business.subcategory || 'General' %></p>
        
        <div id="reviewBox" class="review-box loading">
            <div class="spinner"></div>
        </div>
        
        <div class="button-group">
            <button id="regenerateBtn" class="btn-regenerate" onclick="generateReview()">
                🔄 Refresh Review
            </button>
            <button id="copyBtn" class="btn-copy" onclick="copyToClipboard()">
                📋 Copy
            </button>
            <button id="submitBtn" class="btn-submit" onclick="submitReview()">
                ⭐ Post Review
            </button>
        </div>
    </div>
    
    <div id="notification" class="notification"></div>
    
    <script>
        const LINK_SLUG = '<%= link.slug %>';
        const LINK_TYPE = '<%= link.type %>';
        const GOOGLE_PLACE_ID = '<%= link.googlePlaceId || "" %>';
        const CUSTOM_FORM_URL = '<%= link.customFormUrl || "" %>';
        const GOOGLE_REVIEW_URL = GOOGLE_PLACE_ID ? 
            `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}` : 
            null;
        
        let currentReviewText = '';
        
        async function generateReview() {
            const reviewBox = document.getElementById('reviewBox');
            const regenerateBtn = document.getElementById('regenerateBtn');
            
            reviewBox.className = 'review-box loading';
            reviewBox.innerHTML = '<div class="spinner"></div>';
            regenerateBtn.disabled = true;
            
            try {
                const response = await fetch(`/reviews/<%= link.slug %>/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success && data.reviewText) {
                    currentReviewText = data.reviewText;
                    reviewBox.className = 'review-box';
                    reviewBox.textContent = currentReviewText;
                } else {
                    throw new Error(data.error || 'Generation failed');
                }
            } catch (error) {
                console.error('Error:', error);
                reviewBox.className = 'review-box';
                reviewBox.textContent = 'Error generating review. Please try again.';
                showNotification('Error: ' + error.message, 'error');
            } finally {
                regenerateBtn.disabled = false;
            }
        }
        
        function copyToClipboard() {
            if (!currentReviewText) {
                showNotification('Please generate a review first!', 'error');
                return;
            }
            
            navigator.clipboard.writeText(currentReviewText).then(() => {
                const copyBtn = document.getElementById('copyBtn');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                copyBtn.classList.add('copied');
                showNotification('Review copied to clipboard!', 'success');
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                showNotification('Failed to copy text', 'error');
            });
        }
        
        function submitReview() {
            if (!currentReviewText) {
                showNotification('Please generate a review first!', 'error');
                return;
            }
            
            let targetUrl = '';
            
            if (LINK_TYPE === 'google_review') {
                targetUrl = GOOGLE_REVIEW_URL;
            } else if (LINK_TYPE === 'custom_form') {
                targetUrl = CUSTOM_FORM_URL;
            }
            
            if (!targetUrl) {
                showNotification('Destination not configured', 'error');
                return;
            }
            
            showNotification('Opening review page...', 'success');
            
            // Track submission
            fetch(`/reviews/<%= link.slug %>/api/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: LINK_SLUG, reviewText: currentReviewText })
            }).catch(err => console.error('Tracking error:', err));
            
            setTimeout(() => {
                window.open(targetUrl, '_blank');
            }, 500);
        }
        
        function showNotification(message, type) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.background = type === 'success' ? '#48bb78' : '#f56565';
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Generate review on page load
        window.addEventListener('load', generateReview);
    </script>
</body>
</html>
