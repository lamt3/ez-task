import { Router } from 'express';
import AccountRouter from '../account/routes/AccountRouter';
import TaskRouter from '../market/routes/TaskRouter'
import { authJWT } from '../middlewares/index';


// Init router and path
const router = Router();

// Add sub-routes
router.use('/account', AccountRouter);
router.use('/market', authJWT, TaskRouter);

// Export the base-router
export default router;
