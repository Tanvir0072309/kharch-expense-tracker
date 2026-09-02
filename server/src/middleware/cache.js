const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD
});

client.connect().catch(console.error);

const cache = (duration = 60) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await client.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            res.sendResponse = res.json;
            res.json = (body) => {
                client.setEx(key, duration, JSON.stringify(body));
                res.sendResponse(body);
            };
            
            next();
        } catch (err) {
            next();
        }
    };
};

module.exports = cache;
