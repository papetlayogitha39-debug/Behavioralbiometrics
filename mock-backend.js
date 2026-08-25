/**
 * Mock Backend Service
 * Simulates an API that analyzes behavioral biometrics and returns a continuous authentication score.
 */

class MockBehavioralAPI {
    constructor() {
        this.baselineEstablished = false;
        this.sessionData = [];
        this.baseScore = 50;
    }

    /**
     * Simulates sending data to a server and getting a score back.
     * @param {Object} data - Contains keystroke and mouse data
     * @returns {Promise<Object>} - The analysis result
     */
    async analyzeBehavior(data) {
        // Simulate network latency
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = this._calculateScore(data);
                resolve(result);
            }, 300); // 300ms simulated latency
        });
    }

    _calculateScore(data) {
        // Simulate scoring logic based on input data volume and consistency
        let scoreModifier = 0;
        let confidence = 'Low';

        // Evaluate Keystrokes (e.g., typing rhythm)
        if (data.keystrokes > 5) {
            scoreModifier += 15;
            confidence = 'Medium';
        }
        if (data.keystrokes > 20) {
            scoreModifier += 25;
            confidence = 'High';
        }

        // Evaluate Mouse Movement (e.g., smooth trajectories vs erratic)
        if (data.mouseEvents > 10) {
            scoreModifier += 10;
        }
        if (data.mouseEvents > 50) {
            scoreModifier += 20;
            confidence = data.keystrokes > 10 ? 'High' : 'Medium';
        }

        // Add some "natural" fluctuation to simulate continuous ML model adjustments
        const drift = Math.floor(Math.random() * 10) - 5; // -5 to +5
        
        let newScore = this.baseScore + scoreModifier + drift;
        
        // Cap score between 0 and 100
        newScore = Math.max(0, Math.min(100, newScore));
        
        // If they stop interacting, slowly decay the score (simulating session timeout/uncertainty)
        if (data.keystrokes === 0 && data.mouseEvents === 0) {
            this.baseScore = Math.max(0, this.baseScore - 2);
            newScore = this.baseScore;
            confidence = 'Decaying';
        } else {
            // Gradually build up base score as they establish "normal" behavior
            if (this.baseScore < 70) {
                this.baseScore += 1;
            }
        }

        return {
            score: newScore,
            confidence: confidence,
            status: newScore > 80 ? 'Verified' : newScore > 40 ? 'Monitoring' : 'Suspicious'
        };
    }
}

// Expose globally
window.behavioralAPI = new MockBehavioralAPI();
