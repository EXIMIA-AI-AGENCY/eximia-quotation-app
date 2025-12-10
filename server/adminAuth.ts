import { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getAdminSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "admin_sessions",
  });
  
  return session({
    name: "admin.sid",
    secret: process.env.SESSION_SECRET || "admin-secret-key-2024",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export function setupAdminAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getAdminSession());
  
  // Admin login route
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Verify credentials against environment variables
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña requeridos" });
    }
    
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    if (!validUsername || !validPassword) {
      console.error("Admin credentials not configured in environment variables");
      return res.status(500).json({ message: "Sistema de autenticación no configurado" });
    }
    
    // Simple comparison for username
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }
    
    // Set session
    (req.session as any).isAdmin = true;
    (req.session as any).adminUsername = username;
    
    res.json({ 
      success: true, 
      message: "Autenticación exitosa",
      user: { username }
    });
  });
  
  // Admin logout route
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.clearCookie("admin.sid");
      res.json({ success: true, message: "Sesión cerrada" });
    });
  });
  
  // Check admin status
  app.get("/api/admin/status", (req, res) => {
    const isAdmin = (req.session as any)?.isAdmin === true;
    res.json({ 
      authenticated: isAdmin,
      user: isAdmin ? { username: (req.session as any).adminUsername } : null
    });
  });
}

// Middleware to protect admin routes
export const requireAdmin: RequestHandler = (req, res, next) => {
  if ((req.session as any)?.isAdmin !== true) {
    return res.status(401).json({ message: "Acceso no autorizado" });
  }
  next();
};