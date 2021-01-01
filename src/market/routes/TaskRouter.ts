import { Request, Response, NextFunction, Router } from 'express';
import { TaskService } from '../services/TaskService';
import { Task } from '../models/Task';


const router = Router();
const taskService = new TaskService();

router.post('/task', async (req: Request, resp: Response) => {
    const userId = req.user
    const task = mapReqToTask(req);
    const returnedTask = await taskService.createTask(userId, task);

    return resp.status(200).json({'task': returnedTask});    
});

const mapReqToTask = (req: Request): Task => {
    return req.body.task as Task;
}


export default router;


