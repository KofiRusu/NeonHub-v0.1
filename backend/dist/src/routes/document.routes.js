"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route GET /api/documents?projectId=:projectId
 * @desc Get documents for a project
 * @access Private
 */
router.get('/', auth_middleware_1.protect, document_controller_1.getDocuments);
/**
 * @route GET /api/documents/:id
 * @desc Get single document
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, document_controller_1.getDocument);
/**
 * @route POST /api/documents
 * @desc Upload a new document
 * @access Private
 */
router.post('/', auth_middleware_1.protect, document_controller_1.uploadDocument);
/**
 * @route GET /api/documents/:id/download
 * @desc Download a document
 * @access Private
 */
router.get('/:id/download', auth_middleware_1.protect, document_controller_1.downloadDocument);
/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete('/:id', auth_middleware_1.protect, document_controller_1.deleteDocument);
exports.default = router;
//# sourceMappingURL=document.routes.js.map