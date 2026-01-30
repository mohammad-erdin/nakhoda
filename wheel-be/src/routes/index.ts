import { Router } from 'express';
import authRoutes from './auth.js';
import ruddersRoutes from './rudders.js';
import containersRoutes from './containers.js';
import imagesRoutes from './images.js';
import volumesRoutes from './volumes.js';
import jobsRoutes from './jobs.js';
import auditLogsRoutes from './auditLogs.js';
import settingsRoutes from './settings.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rudders', ruddersRoutes);
router.use('/containers', containersRoutes);
router.use('/images', imagesRoutes);
router.use('/volumes', volumesRoutes);
router.use('/jobs', jobsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/settings', settingsRoutes);

export default router;
