import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { clientAccessMiddleware } from '../middleware/clientAccess.js';
import { exportProducts, importProducts, ImportValidationError } from '../services/excel.service.js';
import { downloadGoogleSheet } from '../services/google-sheets.service.js';

const router = Router();

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isXlsx = file.mimetype === XLSX_MIME || file.originalname.toLowerCase().endsWith('.xlsx');
    if (isXlsx) cb(null, true);
    else cb(new ImportValidationError('Envie uma planilha Excel no formato .xlsx.'));
  },
});

function uploadSingleFile(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'O arquivo é maior que 5 MB.' });
    }
    if (err instanceof ImportValidationError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: 'Não foi possível receber o arquivo.' });
  });
}

router.get(
  '/:clientId/export/excel',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { buffer, filename } = await exportProducts(req.params.clientId, req.query.template === '1');
      res.setHeader('Content-Type', XLSX_MIME);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Excel export failed:', error);
      res.status(500).json({ error: 'Não foi possível gerar a planilha.' });
    }
  }
);

router.post(
  '/:clientId/import/excel',
  authMiddleware,
  clientAccessMiddleware,
  uploadSingleFile,
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    try {
      const result = await importProducts(req.params.clientId, req.file.buffer);
      res.json({ data: result });
    } catch (error) {
      if (error instanceof ImportValidationError) {
        return res.status(400).json({ error: error.message, details: error.details });
      }
      console.error('Excel import failed:', error);
      res.status(500).json({ error: 'Não foi possível importar a planilha.' });
    }
  }
);

router.post(
  '/:clientId/import/google-sheets',
  authMiddleware,
  clientAccessMiddleware,
  async (req: Request, res: Response) => {
    const url = typeof req.body.url === 'string' ? req.body.url : '';
    if (!url.trim()) {
      return res.status(400).json({ error: 'Cole o link da planilha.' });
    }
    try {
      const buffer = await downloadGoogleSheet(url);
      const result = await importProducts(req.params.clientId, buffer);
      res.json({ data: result });
    } catch (error) {
      if (error instanceof ImportValidationError) {
        return res.status(400).json({ error: error.message, details: error.details });
      }
      console.error('Google Sheets import failed:', error);
      res.status(500).json({ error: 'Não foi possível importar a planilha.' });
    }
  }
);

export default router;
