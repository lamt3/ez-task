import { Pool, QueryResult, Query } from 'pg';
import logger from '@shared/Logger';

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PW,
  // connectionString: process.env.PG_CONNECTION_STRING,
  port: process.env.PG_PORT ? +process.env.PG_PORT : 5432
});

const executeQuery = async <T>(sqlStatement: string, stmtEnricher: string[], rowMapper: (result: QueryResult) => T) => {

  let res = null;
  let client = null;
  try {
    logger.info('Running Query: %s', sqlStatement); 
    client = await pool.connect();
    res = await client.query(sqlStatement, stmtEnricher);
  } catch (e) {
    logger.error('Error Executing Query: %s with Error: %s', sqlStatement, e);
  }
  finally {
    // Make sure to release the client before any error handling,
    // just in case the error handling itself throws an error.
    if(client) {
      client.release();
      logger.info('Releasing PG Connection...'); 
    }
  }
  
  return res ? rowMapper(res) : null;
}

const executeWithMultiItems = async <T> (sqlStatement: string, rowMapper: (result: QueryResult) => T): Promise<Array<T> | null> => {
  const client = await pool.connect()
  let res = null;
  let resList = null;
  try { 
    
    res = await client.query(sqlStatement);
    resList = res.rows.map(qr => rowMapper(qr))

  } catch (e) {
    logger.error('Error Executing Query: %s with Error: %s', sqlStatement, e);
  }
  finally {
    if(client){
      client.release();
    }
    
  }
  return resList ;
}

const beginMultiQuery = () => {
  return new SQLState();
}

export {
  executeQuery,
  executeWithMultiItems,
  beginMultiQuery
};


class SQLState {

  queryTransactions: Array<[string, string[]]>; 

  constructor(){
    this.queryTransactions = new Array<[string, string[]]>();
  }

  addToUpdateTransctions ( query: string, queryParams:string[]): SQLState{
    this.queryTransactions.push([query, queryParams]);
    return this;
  }

  async excecute(){
    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      this.queryTransactions.forEach(async (t2) => {
        await client.query(t2[0], t2[1]);
      });
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e
    } finally {
      client.release();
    }
    
    
  }


}