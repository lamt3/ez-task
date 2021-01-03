import { Request, Response, NextFunction, Router } from 'express';
import { TaskService } from '../services/TaskService';
import { Task, TaskComment } from '../models/Task';


const router = Router();
const taskService = new TaskService();

router.get('/task/:task_id', async (req: Request, resp: Response) => {
    const taskId = req.params.task_id
    const returnedTask = await taskService.getTask(taskId);

    return resp.status(200).json({'task': returnedTask});    
});

router.post('/task', async (req: Request, resp: Response) => {
    const userId = req.user
    const task = mapReqToTask(req);
    const returnedTask = await taskService.createTask(userId, task);

    return resp.status(200).json({'task': returnedTask});    
});

router.get('/task/comment/:task_id', async (req: Request, resp: Response) => {
    const taskId = req.params.task_id
    const comments = await taskService.viewComments(taskId);
    if(!comments){
        return resp.status(200).json({'task': ''});    
    }

    return resp.status(200).json(comments);    
});

router.post('/task/comment', async (req: Request, resp: Response) => {
    const userId = req.user
    const taskComment = req.body.taskComment as TaskComment;
    const returnedTask = await taskService.postComment(userId, taskComment);

    return resp.status(200).json({'task': returnedTask});    
});

router.post('/task/comment/reply', async (req: Request, resp: Response) => {
    const userId = req.user
    const task = mapReqToTask(req);
    const returnedTask = await taskService.createTask(userId, task);

    return resp.status(200).json({'task': returnedTask});    
});

router.post('/task/comment/reply', async (req: Request, resp: Response) => {
    const userId = req.user
    const task = mapReqToTask(req);
    const returnedTask = await taskService.createTask(userId, task);

    return resp.status(200).json({'task': returnedTask});    
});

const mapReqToTask = (req: Request): Task => {
    return req.body.task as Task;
}


export default router;


