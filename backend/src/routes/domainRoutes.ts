import { Router } from 'express';
import { DomainService } from '../services/domainService';
import { authenticate } from '../middleware/auth';
import { connectToDatabase } from '../db';
import User from '../models/User';

// Routes for managing SMTP domains used by free users. Domains determine
// which SMTP servers are available for sending emails on the free tier. Only
// authenticated administrators may create new domains. Listing domains hides
// sensitive credentials.

const router = Router();
const domainService = new DomainService();

// Helper to check whether the authenticated user has the admin role. The
// authenticate middleware attaches a `user` property to the request
// containing the user's id. We fetch the full user document from MongoDB
// and inspect its roles array. Returns true if the user is an admin.
async function isAdmin(userId: string): Promise<boolean> {
  await connectToDatabase();
  const user = await User.findById(userId);
  return Array.isArray(user?.roles) && user.roles.includes('admin');
}

// POST /api/domains
// Adds a new SMTP domain configuration. Requires the authenticated user to
// have the 'admin' role. The request body must include host, port,
// secure, username, password, from, and limit fields. The optional order
// field determines priority; lower numbers are tried first.
router.post('/', authenticate, async (req, res) => {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const admin = await isAdmin(authUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: admin role required' });
    }
    const { host, port, secure, username, password, from, limit, order } = req.body;
    if (!host || !port || !username || !password || !from || !limit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) {
      return res.status(400).json({ error: 'Invalid port value' });
    }
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }
    const domain = await domainService.addDomain({
      host,
      port: parsedPort,
      secure: Boolean(secure),
      username,
      password,
      from,
      limit: parsedLimit,
      order: order !== undefined ? parseInt(order, 10) : undefined,
    });
    if (!domain) {
      return res.status(500).json({ error: 'Failed to add domain' });
    }
    // Hide password in response
    const { password: _, ...safeDomain } = domain;
    return res.json(safeDomain);
  } catch (error: any) {
    console.error('Error adding SMTP domain:', error);
    return res.status(500).json({ error: error.message || 'Failed to add domain' });
  }
});

// GET /api/domains
// Returns the list of all configured domains. For security reasons the
// username and password fields are omitted from the response. Optionally
// restricted to authenticated users; unauthenticated requests return 401.
router.get('/', authenticate, async (req, res) => {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Optionally restrict access to admins only. If you wish to allow all
    // authenticated users to view domains, comment out the following lines.
    const admin = await isAdmin(authUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: admin role required' });
    }
    const domains = await domainService.getDomains();
    const sanitized = domains.map(({ password, ...rest }) => rest);
    return res.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching SMTP domains:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch domains' });
  }
});

export default router;