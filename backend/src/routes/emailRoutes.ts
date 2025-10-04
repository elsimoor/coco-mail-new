import { Router } from 'express';
import { EmailService } from '../services/emailService';

const router = Router();
const emailService = new EmailService();

router.post('/create', async (req, res) => {
  try {
    const { userId, aliasName } = req.body;
    const email = await emailService.createEphemeralEmail(userId, aliasName);

    if (!email) {
      return res.status(500).json({ error: 'Failed to create email' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const emails = await emailService.getUserEmails(userId);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId } = req.body;
    const success = await emailService.deactivateEmail(emailId, userId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to deactivate email' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
