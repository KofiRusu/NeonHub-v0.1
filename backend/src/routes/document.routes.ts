import { Router } from 'express';
import { 
  getDocuments,
  getDocument,
  uploadDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/document.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/documents?projectId=:projectId
 * @desc Get documents for a project
 * @access Private
 */
router.get('/', protect, getDocuments);

/**
 * @route GET /api/documents/:id
 * @desc Get single document
 * @access Private
 */
router.get('/:id', protect, getDocument);

/**
 * @route POST /api/documents
 * @desc Upload a new document
 * @access Private
 */
router.post('/', protect, uploadDocument);

/**
 * @route GET /api/documents/:id/download
 * @desc Download a document
 * @access Private
 */
router.get('/:id/download', protect, downloadDocument);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete('/:id', protect, deleteDocument);

export default router; 