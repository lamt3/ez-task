import passport from "passport";
import passportFacebook, { StrategyOptionWithRequest, Profile } from "passport-facebook";
import passportGoogle from 'passport-google-oauth20';

import { Request, Response, NextFunction, Router } from 'express';

import { UserA } from '../account/entities/UserA';
import {executeQuery, beginMultiQuery} from '../daos/common/SQLPatterns';
import { QueryResult } from 'pg';
import jwt from 'jsonwebtoken';


const FacebookStrategy = passportFacebook.Strategy;

passport.serializeUser<any, any>((user, done) => {
    done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
   
});


const fbOptions: StrategyOptionWithRequest = {
    clientID: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '',
    profileFields: ["email", "name"],
    passReqToCallback: true
}


const generateJWTToken = async (userId: string) => {
    const token = jwt.sign({}, 'secret', {
        expiresIn: '7d',
        audience: 'public',
        issuer: 'backend',
        subject: userId
    });

    return token;
}

const verifyFunction = async(accessToken: string, refreshToken: string, profile: Profile, done: any) => {

    // const user = null;
    // const userId = await executeQuery("SELECT * FROM USER_ACCOUNT WHERE ID = " + profile.id, (queryResult : QueryResult) => {
    //     const result =  queryResult.rows[0];
    //     const id: UserA = result.name;
    //     return id;
    // });

    // if(!userId ){
    //     const jwtToken = generateJWTToken(profile.id);
        
    //     //create user 
    // }


    // return done(null, userId)


}

passport.use(new FacebookStrategy(fbOptions, verifyFunction));

const GoogleStrategy = passportFacebook.Strategy;




/**
 * Login Required middleware.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

/**
 * Authorization Required middleware.
 */
export const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    const provider = req.path.split("/").slice(-1)[0];

    // const user = req.user as UserDocument;
    // if (_.find(user.tokens, { kind: provider })) {
    //     next();
    // } else {
    //     res.redirect(`/auth/${provider}`);
    // }
};


