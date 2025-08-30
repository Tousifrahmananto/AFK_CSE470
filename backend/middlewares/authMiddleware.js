// backend/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

// Read token from Authorization header (Bearer) or cookie
function extractToken(req) {
    const h = req.headers?.authorization || "";
    if (h.startsWith("Bearer ")) return h.slice(7).trim();
    if (req.cookies && req.cookies.token) return req.cookies.token;
    return null;
}

// Protect: require a valid JWT and attach { userId, role } to req.user
async function protect(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: "Not authorized – no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Support different payload shapes just in case
        const userId = decoded.userId || decoded.id || decoded._id;
        const role = decoded.role;

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        req.user = { userId: String(userId), role: role || "Player" };
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// Role guard: require any of the specified roles
function requireRole(...roles) {
    return (req, res, next) => {
        const r = req.user?.role;
        if (!r || !roles.includes(r)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
}

// Convenience: admin-only
function isAdmin(req, res, next) {
    return requireRole("Admin")(req, res, next);
}

module.exports = { protect, requireRole, isAdmin };
