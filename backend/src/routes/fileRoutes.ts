import { Router } from 'express';
import { FileService } from '../services/fileService';

const router = Router();
const fileService = new FileService();

router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      filename,
      encryptedFileUrl,
      fileSize,
      passwordProtected,
      password,
      expiresAt,
      maxDownloads,
      watermarkEnabled
    } = req.body;

    const file = await fileService.createFile(
      userId,
      filename,
      encryptedFileUrl,
      fileSize,
      passwordProtected,
      password,
      expiresAt,
      maxDownloads,
      watermarkEnabled
    );

    if (!file) {
      return res.status(500).json({ error: 'Failed to create file' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await fileService.getUserFiles(userId);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { password } = req.query;
    const file = await fileService.getFile(fileId, password as string);

    if (!file) {
      return res.status(404).json({ error: 'File not found or invalid password' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    const success = await fileService.incrementDownloadCount(fileId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update download count' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;
    const success = await fileService.deleteFile(fileId, userId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
