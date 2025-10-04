import { Router } from 'express';
import { NoteService } from '../services/noteService';

const router = Router();
const noteService = new NoteService();

router.post('/create', async (req, res) => {
  try {
    const { userId, title, encryptedContent, autoDeleteAfterRead, expiresAt } = req.body;
    const note = await noteService.createNote(
      userId,
      title,
      encryptedContent,
      autoDeleteAfterRead,
      expiresAt
    );

    if (!note) {
      return res.status(500).json({ error: 'Failed to create note' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await noteService.getUserNotes(userId);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.query;
    const note = await noteService.getNote(noteId, userId as string);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;
    const success = await noteService.deleteNote(noteId, userId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
