import jwt from "jsonwebtoken";

export const requireJWT = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isAdmin) return next();
    return res.status(403).json({ error: "Forbidden" });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
