const rateLimit = (options = {}) => {
    const windowMs = options.windowMs || 60000; // 1 minute
    const max = options.max || 100; // 100 requests per minute
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        
        if (recentRequests.length >= max) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        
        recentRequests.push(now);
        requests.set(key, recentRequests);
        next();
    };
};

module.exports = rateLimit;
