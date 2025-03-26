const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access Denied: No token provided" });
    }

    jwt.verify(token, "secretKey", (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user; // Token'deki kullanıcı bilgilerini talebe ekle
        next();
    });
};

module.exports = authenticateToken;
