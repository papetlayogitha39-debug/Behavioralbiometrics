document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Demo Logic ---
    
    // UI Elements
    const demoInput = document.getElementById('demo-input');
    const mouseArea = document.getElementById('mouse-area');
    const cursorTrail = document.getElementById('cursor-trail');
    const scoreText = document.getElementById('score-text');
    const scoreCircle = document.getElementById('score-circle');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const metricTyping = document.getElementById('metric-typing');
    const metricMouse = document.getElementById('metric-mouse');
    const metricConfidence = document.getElementById('metric-confidence');

    // State
    let sessionData = {
        keystrokes: 0,
        mouseEvents: 0
    };
    let lastKeyTime = Date.now();
    let typingSpeeds = [];
    
    // Polling interval for continuous authentication
    let authInterval;

    // 1. Capture Keystroke Dynamics
    demoInput.addEventListener('keydown', (e) => {
        sessionData.keystrokes++;
        
        // Calculate typing cadence (time between keys)
        const now = Date.now();
        const timeDiff = now - lastKeyTime;
        if (timeDiff < 1000) { // Ignore long pauses
            typingSpeeds.push(timeDiff);
            if (typingSpeeds.length > 10) typingSpeeds.shift(); // Keep last 10
            
            const avgSpeed = typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length;
            metricTyping.textContent = `${Math.round(avgSpeed)} ms/key`;
        }
        lastKeyTime = now;
        
        triggerAnalysis();
    });

    // 2. Capture Mouse Movements
    mouseArea.addEventListener('mousemove', (e) => {
        sessionData.mouseEvents++;
        
        // Visual feedback
        cursorTrail.style.left = `${e.clientX - mouseArea.getBoundingClientRect().left}px`;
        cursorTrail.style.top = `${e.clientY - mouseArea.getBoundingClientRect().top}px`;
        cursorTrail.style.opacity = '1';
        
        clearTimeout(mouseArea.trailTimeout);
        mouseArea.trailTimeout = setTimeout(() => {
            cursorTrail.style.opacity = '0';
        }, 200);

        metricMouse.textContent = 'Active tracking...';
        triggerAnalysis();
    });

    mouseArea.addEventListener('mouseleave', () => {
        metricMouse.textContent = 'Inactive';
        cursorTrail.style.opacity = '0';
    });

    // Debounce the analysis trigger so we don't spam the "API"
    let analysisTimeout;
    function triggerAnalysis() {
        clearTimeout(analysisTimeout);
        analysisTimeout = setTimeout(() => {
            performAuthentication();
        }, 500); // Wait for 500ms of inactivity before sending a chunk
    }

    // Main continuous authentication loop
    async function performAuthentication() {
        // Send data to our Mock Backend
        statusText.textContent = 'Analyzing behavior...';
        statusDot.classList.add('active');
        
        try {
            // Using the global mockAPI created in mock-backend.js
            const result = await window.behavioralAPI.analyzeBehavior(sessionData);
            updateDashboard(result);
            
            // Reset counters for the next window
            sessionData.keystrokes = 0;
            sessionData.mouseEvents = 0;
            
        } catch (error) {
            console.error("Analysis failed", error);
        }
    }

    function updateDashboard(result) {
        // Update Score Text
        scoreText.textContent = `${result.score}%`;
        
        // Update SVG Circle
        // The stroke-dasharray is length, gap. Full circle is ~100.
        scoreCircle.setAttribute('stroke-dasharray', `${result.score}, 100`);
        
        // Update Colors based on score
        scoreCircle.className.baseVal = 'circle'; // Reset classes
        if (result.score >= 80) {
            scoreCircle.classList.add('score-good');
        } else if (result.score >= 40) {
            scoreCircle.classList.add('score-warn');
        } else {
            scoreCircle.classList.add('score-danger');
        }

        // Update Status
        statusText.textContent = `Status: ${result.status}`;
        if (result.status === 'Verified') {
            statusDot.style.background = 'var(--accent-success)';
            statusDot.style.boxShadow = '0 0 10px var(--accent-success)';
        } else if (result.status === 'Monitoring') {
            statusDot.style.background = 'var(--accent-warning)';
            statusDot.style.boxShadow = '0 0 10px var(--accent-warning)';
        } else {
            statusDot.style.background = 'var(--accent-danger)';
            statusDot.style.boxShadow = '0 0 10px var(--accent-danger)';
        }

        // Update Confidence Metric
        metricConfidence.textContent = result.confidence;
    }

    // Start background decay/monitoring loop
    setInterval(() => {
        // If no active interaction is triggering analysis, force a periodic check 
        // to decay the score if the user goes AFK
        if (sessionData.keystrokes === 0 && sessionData.mouseEvents === 0) {
             performAuthentication();
        }
    }, 5000); // Check every 5 seconds
});
