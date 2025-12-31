// admin.js - Secret admin access for index.html
document.addEventListener('DOMContentLoaded', function() {
    // Secret click pattern: click studio name 3 times
    let clickPattern = [];
    const secretPattern = [1, 1, 1]; // Three clicks
    const secretTimeout = 2000; // Reset after 2 seconds
    
    // Detect clicks on studio name/logo
    const studioName = document.querySelector('.hero-title') || 
                      document.querySelector('.footer-brand h3') ||
                      document.querySelector('.nav-brand');
    
    if (studioName) {
        studioName.style.cursor = 'pointer';
        studioName.title = 'Click me for secret access';
        
        studioName.addEventListener('click', function() {
            clickPattern.push(1);
            
            // Check if pattern matches
            if (clickPattern.length >= secretPattern.length) {
                const recentClicks = clickPattern.slice(-secretPattern.length);
                if (JSON.stringify(recentClicks) === JSON.stringify(secretPattern)) {
                    // Show admin access prompt
                    const password = prompt('🔒 Admin Access Required\nEnter password:');
                    if (password === 'admin123') {
                        window.location.href = 'admin.html';
                    } else if (password) {
                        alert('❌ Incorrect password!');
                    }
                    clickPattern = []; // Reset pattern
                }
            }
            
            // Reset pattern after timeout
            setTimeout(() => {
                clickPattern = [];
            }, secretTimeout);
        });
    }
});