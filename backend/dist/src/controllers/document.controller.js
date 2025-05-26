"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.downloadDocument = exports.uploadDocument = exports.getDocument = exports.getDocuments = void 0;
const index_1 = require("../index");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
// For now, this is a simple local file storage implementation
// In production, you'd use a cloud storage service like AWS S3
const UPLOAD_DIR = process.env.STORAGE_PATH || path_1.default.join(__dirname, '../../uploads');
// Ensure upload directory exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
/**
 * Get documents for a project
 * @route GET /api/documents?projectId=:projectId
 * @access Private
 */
const getDocuments = async (req, res) => {
    try {
        const { projectId } = req.query;
        const userId = req.user?.id;
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required',
            });
        }
        // Check if user has access to the project
        const project = await index_1.prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
            },
        });
        if (!project) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this project',
            });
        }
        // Get documents for the project
        const documents = await index_1.prisma.document.findMany({
            where: { projectId: projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents,
        });
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getDocuments = getDocuments;
/**
 * Get single document
 * @route GET /api/documents/:id
 * @access Private
 */
const getDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const userId = req.user?.id;
        // Get document by ID
        const document = await index_1.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                project: {
                    include: {
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }
        // Check if user has access to the project
        const hasAccess = document.project.ownerId === userId ||
            document.project.members.some((member) => member.id === userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this document',
            });
        }
        // Remove project details from response
        const { project, ...documentData } = document;
        res.status(200).json({
            success: true,
            data: documentData,
        });
    }
    catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getDocument = getDocument;
/**
 * Upload document
 * @route POST /api/documents
 * @access Private
 */
const uploadDocument = async (req, res) => {
    try {
        // Note: In a real implementation, you'd use a multipart/form-data parser like multer
        // For simplicity, we're assuming the file data is sent in the request body
        const { name, description, projectId, fileData, fileType, fileSize } = req.body;
        const userId = req.user?.id;
        // Check if user has access to the project
        const project = await index_1.prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
            },
        });
        if (!project) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to upload documents to this project',
            });
        }
        // Generate unique filename
        const filename = `${(0, uuid_1.v4)()}-${name.replace(/\s+/g, '-')}`;
        const filePath = path_1.default.join(UPLOAD_DIR, filename);
        // In a real implementation, the file would be saved from the upload
        // Here we're just creating a placeholder file for demonstration
        fs_1.default.writeFileSync(filePath, fileData || 'Sample file content');
        // Save document metadata to database
        const document = await index_1.prisma.document.create({
            data: {
                name,
                description,
                fileUrl: `/uploads/${filename}`,
                fileType,
                fileSize: fileSize || 0,
                projectId,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: document,
        });
    }
    catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.uploadDocument = uploadDocument;
/**
 * Download document
 * @route GET /api/documents/:id/download
 * @access Private
 */
const downloadDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const userId = req.user?.id;
        // Get document by ID
        const document = await index_1.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                project: {
                    include: {
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }
        // Check if user has access to the project
        const hasAccess = document.project.ownerId === userId ||
            document.project.members.some((member) => member.id === userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this document',
            });
        }
        // Get the file path from the fileUrl
        const filename = document.fileUrl.split('/').pop();
        const filePath = path_1.default.join(UPLOAD_DIR, filename);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
            });
        }
        // Send the file
        res.download(filePath, document.name);
    }
    catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.downloadDocument = downloadDocument;
/**
 * Delete document
 * @route DELETE /api/documents/:id
 * @access Private
 */
const deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const userId = req.user?.id;
        // Get document with project info to check access rights
        const document = await index_1.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                project: true,
            },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }
        // Check if user is authorized to delete the document (uploader or project owner)
        const canDelete = document.userId === userId || document.project.ownerId === userId;
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this document',
            });
        }
        // Delete the file from storage
        const filename = document.fileUrl.split('/').pop();
        const filePath = path_1.default.join(UPLOAD_DIR, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete document from database
        await index_1.prisma.document.delete({
            where: { id: documentId },
        });
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=document.controller.js.map