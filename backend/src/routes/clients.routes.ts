import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as clientService from '../services/client.service.js';

const router = Router();

// Get all clients for authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clients = await clientService.getClientsByUser(req.userId!);
    res.json({ data: clients });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new client
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, slug, email, phone } = req.body;

    if (!name || !slug || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await clientService.createClient(req.userId!, {
      name,
      slug,
      email,
      phone,
    });

    res.status(201).json({ data: client });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get client details
router.get('/:clientId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const client = await clientService.getClientById(req.params.clientId, req.userId!);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ data: client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.patch('/:clientId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const client = await clientService.updateClient(
      req.params.clientId,
      req.userId!,
      req.body
    );
    res.json({ data: client });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete client
router.delete('/:clientId', authMiddleware, async (req: Request, res: Response) => {
  try {
    await clientService.deleteClient(req.params.clientId, req.userId!);
    res.json({ message: 'Client deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
