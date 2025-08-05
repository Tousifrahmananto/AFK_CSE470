const isAdmin = (req, res, next) => {
    if (req.user.role === "Admin") {
        next();
    } else {
        res.status(403).json({ message: "Access denied: Admins only" });
    }
};

module.exports = { isAdmin };
