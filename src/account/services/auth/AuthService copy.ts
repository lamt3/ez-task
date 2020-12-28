import { LoginTicket, OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { QueryResult } from 'pg';
import axios from 'axios';

import { UserA } from '../../entities/UserA';
import { executeQuery } from '../../../daos/common/SQLPatterns';
import logger from '@shared/Logger';




const generateJWTToken = (userId: string) => {
    const token = jwt.sign({}, 'secret', {
        expiresIn: '7d',
        audience: 'public',
        issuer: 'backend',
        subject: userId
    });

    return token;
}

interface IAuthService {
    auth: (userClientToken: string) => Promise<UserA | null>;
}

const processQueryResult = (queryResult: QueryResult): UserA | null  => {
    const result = queryResult.rows[0];
    if(!result){
        return null;
    }
    const {oid, first_name, last_name, email} = result;
    const jwtToken = generateJWTToken(oid);
    return new UserA(oid,first_name, last_name, email, jwtToken);
}

const processInsertResult = (queryResult: QueryResult): UserA => {
    const {oid, first_name, last_name, email} = queryResult.rows[0];
    const jwtToken = generateJWTToken(oid);
    return new UserA(oid,first_name, last_name, email, jwtToken);
}


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

class GoogleAuthService implements IAuthService {
    
    public async auth(userClientToken: string): Promise<UserA | null>  {

        return AuthBuilder.build()
                            .withAuthCall(this.getGoogleResponse)
                            .withExtractClientUId(this.extractClientUserId)
                            .withUserInsertValues(this.getUserValues)
                            .auth(userClientToken);
        // const googleResponse = await this.getGoogleResponse(userClientToken);
        // if (!googleResponse){
        //     return null;
        // }
        // const returnedUser = await this.getGoogleUserId(googleResponse);
        // if(!returnedUser){
        //     return await this.createUser(googleResponse);
        // }
        // return returnedUser;
    }

    private extractClientUserId(googleResponse: LoginTicket): string{
        return googleResponse.getUserId()!;
    }

    private getUserValues(googleResponse: LoginTicket): string[] {
        const clientUserId = googleResponse.getUserId()!;
        const { given_name, email, family_name } = googleResponse.getPayload()!;   
        const insertValues: string[] = [clientUserId, email!, given_name!, family_name!];
        return insertValues;
    }
    

    private async getGoogleUserId(googleResponse: LoginTicket): Promise<UserA | null> {
        const client_user_id: string = googleResponse.getUserId()!;
        const returnedUser: UserA | null = await executeQuery('SELECT * FROM USERS WHERE client_user_id = $1', [client_user_id], processQueryResult);
        return returnedUser;
    }

    private async createUser(googleResponse: LoginTicket): Promise<UserA | null>{
        const clientUserId = googleResponse.getUserId()!;
        const { given_name, email, family_name } = googleResponse.getPayload()!;   
        const insertValues: string[] = [clientUserId, email!, given_name!, family_name!];
        const createdUser = await executeQuery('INSERT INTO USERS (client_user_id, email, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *', insertValues, processInsertResult);
        return createdUser;
    }

    private async getGoogleResponse(clientToken: string){
        try{
            const googleResponse = await googleClient.verifyIdToken({
                idToken: clientToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            return googleResponse;

        }catch(e){
            logger.error('Error Fetching Google Response For Client Token: %s with Msg: %s', clientToken, e)
        }
        return null;
    }
    
}

class FBAuthService implements IAuthService {
    public async auth(userClientToken: string): Promise<UserA | null>{

        const { data } = await axios({
            url: 'https://graph.facebook.com/me',
            method: 'get',
            params: {
              fields: ['id', 'email', 'first_name', 'last_name'].join(','),
              access_token: userClientToken,
            },
          });

        const { id, email, first_name, last_name } = data;
        if(!data){
            return null;
        }
        const returnedUser = await this.getFBUserId(data);

        if(!returnedUser){
            return await this.createUser(data);
        }

        return null;
    } 

    private async getFBUserId(fbResponse: any): Promise<UserA | null>{
        const clientUserId: string = fbResponse.id;
        const returnedUser: UserA | null = await executeQuery('SELECT * FROM USERS WHERE client_user_id = $1', [clientUserId], processQueryResult);
        return returnedUser;
    }

    private async createUser(data: any): Promise<UserA | null>{
        const { id, email, first_name, last_name } = data;
        const insertValues: string[] = [id, email!, first_name!, last_name!];
        const createdUser = await executeQuery('INSERT INTO USERS (client_user_id, email, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *', insertValues, processInsertResult);
        return createdUser;
    }
}


const selectAuthService = (authType: string) => {
    if(authType === 'google'){
        return new GoogleAuthService();
    }
}

export {
    selectAuthService
}


class AuthBuilder {

    public authExtractor!: ((userClientToken: string) => Promise<any| null>); 
    public userClientIdExtractor!: (data: any) => string; 
    public generateUserInsertValues!: (data: any) => string[];

    public static build(){
        return new AuthBuilder();
    }

    public withAuthCall(authCall: (userClientToken: string) => Promise<any| null>){
        this.authExtractor = authCall;
        return this;
    }

    public withExtractClientUId(extractor: (data: any) => string) {
        this.userClientIdExtractor = extractor;
        return this;
    }

    public withUserInsertValues(extractor: (data: any) => string[]) {
        this.generateUserInsertValues = extractor;
        return this;
    }

    public async auth(userClientToken: string): Promise<UserA | null>{

        const data  = await this.authExtractor(userClientToken);
        
        if(!data){
            return null;
        }
        const returnedUser = await this.getClientUserId(data);

        if(!returnedUser){
            return await this.createUser(data);
        }

        return returnedUser;
    } 

    private async getClientUserId(data: any): Promise<UserA | null>{
        const clientUserId: string = this.userClientIdExtractor(data);
        const returnedUser: UserA | null = await executeQuery('SELECT * FROM USERS WHERE client_user_id = $1', [clientUserId], processQueryResult);
        return returnedUser;
    }

    private async createUser(data: any): Promise<UserA | null>{
        const insertValues: string[] = this.generateUserInsertValues(data);
        const createdUser = await executeQuery('INSERT INTO USERS (client_user_id, email, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *', insertValues, processInsertResult);
        return createdUser;
    }


    





}