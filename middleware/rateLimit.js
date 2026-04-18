const rateLimitBuckets = new Map();

function getClientKey(req) {
    const routeKey = `${req.method}:${req.baseUrl || ''}${req.path || req.originalUrl || ''}`;
    return `${req.ip || 'unknown'}:${routeKey}`;
}

function setRateLimitHeaders(res, max, remaining, resetAt) {
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
}

function cleanupBucket(key, bucket) {
    if (!bucket || bucket.count <= 0) {
        rateLimitBuckets.delete(key);
    }
}

function createRateLimiter(options) {
    const {
        windowMs,
        max,
        skipSuccessfulRequests = false,
        keyGenerator = getClientKey,
        handler
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        let bucket = rateLimitBuckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
        }

        bucket.count += 1;
        rateLimitBuckets.set(key, bucket);

        if (skipSuccessfulRequests) {
            res.on('finish', () => {
                if (res.statusCode >= 400) return;

                const currentBucket = rateLimitBuckets.get(key);
                if (!currentBucket || currentBucket.resetAt <= Date.now()) {
                    return cleanupBucket(key, currentBucket);
                }

                currentBucket.count = Math.max(0, currentBucket.count - 1);
                cleanupBucket(key, currentBucket);
            });
        }

        const remaining = Math.max(0, max - bucket.count);
        setRateLimitHeaders(res, max, remaining, bucket.resetAt);

        if (bucket.count > max) {
            res.setHeader('Retry-After', Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
            return handler(req, res, next);
        }

        return next();
    };
}

module.exports = { createRateLimiter };
