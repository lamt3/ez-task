import { LoginTicket, OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { QueryResult } from 'pg';
import axios from 'axios';

import { TaskPoster, UserA } from '../../entities/UserA';
import { executeQuery } from '../../../daos/common/SQLPatterns';
import logger from '@shared/Logger';


interface IAuthService {
    auth: (userClientToken: string) => Promise<UserA | null>;
    getAuthResponse: (response: any) => Promise<any | null >;
    extractClientUserId:(data: any) => string;
    getUserValues:(data: any) => string[];

}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

class GoogleAuthService implements IAuthService {

    public async auth(userClientToken: string): Promise<UserA | null> {

        return AuthBuilder.build()
                            .withAuthCall(this.getAuthResponse)
                            .withExtractClientUId(this.extractClientUserId)
                            .withUserInsertValues(this.getUserValues)
                            .auth(userClientToken);
    }

    extractClientUserId(googleResponse: LoginTicket): string {
        return googleResponse.getUserId()!;
    }

    getUserValues(googleResponse: LoginTicket): string[] {
        const clientUserId = googleResponse.getUserId()!;
        const { given_name, email, family_name } = googleResponse.getPayload()!;
        const insertValues: string[] = [clientUserId, email!, given_name!, family_name!];
        return insertValues;
    }

    async getAuthResponse(userClientToken: string) {
        try {
            const googleResponse = await googleClient.verifyIdToken({
                idToken: userClientToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            return googleResponse;

        } catch (e) {
            logger.error('Error Fetching Google Response For Client Token: %s with Msg: %s', userClientToken, e)
        }
        return null;
    }

}

class FBAuthService implements IAuthService {
    public async auth(userClientToken: string): Promise<UserA | null> {

        return AuthBuilder.build()
                            .withAuthCall(this.getAuthResponse)
                            .withExtractClientUId(this.extractClientUserId)
                            .withUserInsertValues(this.getUserValues)
                            .auth(userClientToken);
    }

    async getAuthResponse(userClientToken: string) {

        try {
            const { data } = await axios({
                url: 'https://graph.facebook.com/me',
                method: 'get',
                params: {
                    fields: ['id', 'email', 'first_name', 'last_name'].join(','),
                    access_token: userClientToken,
                },
            });

            return data;

        } catch (e) {
            logger.error('Error Fetching FB Response For Client Token: %s with Msg: %s', userClientToken, e)
        }
        return null;

    }

    extractClientUserId(fbResponse: any): string {
        return fbResponse.id;
    }

    getUserValues(data: any): string[] {
        const { id, email, first_name, last_name } = data;
        const insertValues: string[] = [id, email!, first_name!, last_name!];
        return insertValues;
    }
}

class AuthBuilder {

    public authorizeClientToken!: (userClientToken: string) => Promise<any | null>;
    public userClientIdExtractor!: (data: any) => string;
    public generateUserInsertValues!: (data: any) => string[];

    public static build() {
        return new AuthBuilder();
    }

    public withAuthCall(authCall: (userClientToken: string) => Promise<any | null>) {
        this.authorizeClientToken = authCall;
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

    public async auth(userClientToken: string): Promise<UserA | null> {

        const authResponse = await this.authorizeClientToken(userClientToken);

        if (!authResponse) {
            return null;
        }
        const returnedUser = await this.checkForExistingUser(authResponse);

        if (!returnedUser) {
            return await this.createUser(authResponse);
        }

        return returnedUser;
    }

    private async checkForExistingUser(data: any): Promise<UserA | null> {
        const clientUserId: string = this.userClientIdExtractor(data);
        const returnedUser: UserA | null = await executeQuery('SELECT * FROM USERS WHERE client_user_id = $1', [clientUserId], this.processQueryResult);
        return returnedUser;
    }

    private async createUser(data: any): Promise<UserA | null> {
        const insertValues: string[] = this.generateUserInsertValues(data);
        const insertQuery = `INSERT INTO USERS 
                            (client_user_id, email, first_name, last_name) 
                            VALUES($1, $2, $3, $4) 
                            RETURNING *`
        const createdUser = await executeQuery(insertQuery, insertValues, this.processInsertResult);
        return createdUser;
    }

    private generateJWTToken = (userId: string) => {
        console.log(userId);
        const token = jwt.sign({}, 'secret', {
            expiresIn: '7d',
            audience: 'public',
            issuer: 'backend',
            subject: userId
        });

        return token;
    }

    private processQueryResult = (queryResult: QueryResult): UserA | null => {
        const result = queryResult.rows[0];
        if (!result) {
            return null;
        }
        const { oid, first_name, last_name, email } = result;
        const jwtToken = this.generateJWTToken(oid);
        return new UserA(oid, first_name, last_name, email, jwtToken);
    }

    private processInsertResult = (queryResult: QueryResult): UserA => {
        const { oid, first_name, last_name, email } = queryResult.rows[0];
        const jwtToken = this.generateJWTToken(oid);
        return new UserA(oid, first_name, last_name, email, jwtToken);
    }

}

const selectAuthService = (authType: string) => {
    if (authType === 'google') {
        return new GoogleAuthService();
    }
    else if (authType === 'fb') {
        return new FBAuthService();
    }
}

export {
    selectAuthService
}