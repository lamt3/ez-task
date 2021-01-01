import { Request, Response, NextFunction, Router } from 'express';

import { selectAuthService } from '../services/auth/AuthService';
import { authJWT } from '../../middlewares/index';

const router = Router();

router.post('/auth/:provider', async (req: Request, resp: Response) => {
    const { token } = req.body;
    const provider = req.params.provider;

    const authService = selectAuthService(provider);
    const userResponse = await authService?.auth(token);
    if(!userResponse){
        return resp.status(400).json({'isUserAuthorized': false, user: null});    
    }

    return resp.status(200).json({'isUserAuthorized': true, user: userResponse});    
});

router.get('/auth/check', authJWT, async (req: Request, resp: Response) => {
    return resp.status(200).json({'jwtValid': true, userId: req.user})
});

router.post('/auth/dummy/user', authJWT, async (req: Request, resp: Response) => {
    return resp.status(200).json({'jwtValid': true, userId: req.user})
});


export default router; 