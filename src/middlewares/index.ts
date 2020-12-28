import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import logger from '@shared/Logger';

const generateJWTToken = (userId: string) => {
    console.log(userId);
    const token = jwt.sign(userId, 'secret', {
        expiresIn: '7d',
        audience: 'public',
        issuer: 'backend',
        subject: userId
    });

    return token;
}

/*
Send 401 Unauthorized Error
*/
const authJWT = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(' ')[1];
        try{
            const userTokenObj: any = await jwt.verify(token, 'secret');
            const { sub } = userTokenObj;
            req.user = sub;
            next();
        }catch(e){
            logger.error('Error Decrypting JWT Token: %s with Msg: %s', token, e);
            res.status(401).send('Invalid Auth');
            return;
        }
    }else{
        res.status(401).send('Invalid Auth');
    }
}

export {
    authJWT
}