import { executeQuery } from "@daos/common/SQLPatterns"
import jwt from 'jsonwebtoken';

import logger from "@shared/Logger"
import { QueryResult } from "pg"
import { UserA } from "src/account/entities/UserA"

const insertQuery = `INSERT INTO USERS 
                            (client_user_id, email, first_name, last_name) 
                            VALUES($1, $2, $3, $4) 
                            RETURNING *`

const generateJWTToken = (userId: string) => {
    console.log(userId);
    const token = jwt.sign({}, 'secret', {
        expiresIn: '7d',
        audience: 'public',
        issuer: 'backend',
        subject: userId
    });

    return token;
}

const createDummyUser = async (): Promise<UserA> => {

    const newUser = await executeQuery(insertQuery, ['test', 'test_emai', 'fit_war29', 'bobby'], (qr: QueryResult) => {
        return qr.rows[0];
    });
    const returnUser = new UserA();
    returnUser.id = newUser.oid;
    returnUser.jwtToken = generateJWTToken(newUser.oid);
    return returnUser;
}

export {
    createDummyUser
}
    


