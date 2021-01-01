import { QueryResult } from 'pg';
import { executeQuery } from '../../daos/common/SQLPatterns';
import { Task, TaskComment } from '../models/Task';


const insertTaskQuery = `
with ins as (
    INSERT INTO TASK
    (task_type, user_id, title, description, must_haves, amount, currency, locationStr, lat, long, created_date)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
)
SELECT *
FROM ins 
JOIN users on users.oid = ins.user_id;
`

const insertCommentQuery = `
INSERT INTO COMMENTS (user_id, task_id, comment_text, created_date)
VALUES($1,$2,$3,$4,$)
`

const insertCommentReplyQuery = `
INSERT INTO COMMENTS (parent_comment_id, user_id, task_id, comment_text, created_date)
VALUES($1,$2,$3,$4,$5)
`

const getCommentsQuery = `
with parent_names as(
	SELECT * 
	FROM comments 
	join users on comments.user_id = users.oid
),

parent_child_comments as (
    select  c.comment_id as parent_id, c.comment_text as parent_text, c.oid as parent_user_id
    c.oid as parent_user_id, c.first_name as parent_name, c.created_date, 
    json_agg(
		jsonb_build_object('comment_id', r.comment_id,
						   'message', r.comment_text,
                           'user_id', r.user_id,
                           'user_name', r.first_name,
                           'user_ln', r.last_name)
	)::jsonb as replies
	from parent_names as c
	join comments r on c.comment_id = r.parent_comment_id
	join users u on r.user_id = u.oid
	where c.task_id = '67d273eb-8a66-480c-b97d-015ddc4bae3c'
	GROUP BY c.comment_id, c.comment_text, c.first_name, c.created_date

),
parent_only_comments as (
    select c.comment_id as parent_id, c.comment_text as parent_text, 
    c.oid as parent_user_id, c.first_name as parent_name, 
    c.created_date, null::jsonb as replies
	from parent_names as c
	where c.task_id = '67d273eb-8a66-480c-b97d-015ddc4bae3c'
	and c.comment_id not in (
 		select h.comment_id
 		from comments as h
 		join comments r on c.comment_id = r.parent_comment_id 
 		where c.task_id = '67d273eb-8a66-480c-b97d-015ddc4bae3c'
 	)	
	and c.parent_comment_id is null
	
),
combined as (
	select * 
	from parent_child_comments
	union
	select * 
	from parent_only_comments
)

select * from combined order by created_date;
`


export class TaskService {

    async createTask(userId: any, task: Task){
        task.createdDate = new Date();
        const insertValues = [task.taskType, userId, task.title, task.description, task.mustHaves, task.amount, task.currency, task.locationStr, task.lat, task.long, task.createdDate];
        const generatedTaskId = await executeQuery(insertTaskQuery, insertValues, this.extractTaskId);
        if (!generatedTaskId){
            return null;
        }
        task.taskId = generatedTaskId;
        return task;
    }

    async postComment(userId: any, taskComment: TaskComment) {
        taskComment.createdDate = new Date();
        const insertValues = [userId, taskComment.taskId, taskComment.message, taskComment.createdDate];
        const commentId = await executeQuery(insertCommentQuery, insertValues, (queryResult) => {
            return queryResult.rows[0].comment_id;
        });
        if(!commentId) {
            return null;
        }
        taskComment.commentId = commentId;
        return taskComment;
    }
    

    async postReply(userId: any, parentCommentId: any, taskComment: TaskComment) {
        taskComment.createdDate = new Date();
        const insertValues = [parentCommentId, userId, taskComment.taskId, taskComment.message, taskComment.createdDate];
        const commentId = await executeQuery(insertCommentReplyQuery, insertValues, (queryResult) => {
            return queryResult.rows[0].comment_id;
        });
        if(!commentId) {
            return null;
        }
        taskComment.commentId = commentId;
        return taskComment;
    }

    async viewTask(){

    }

    async viewNearbyTasks(){

    }

    async changeTaskStatus(){

    }

    extractTaskId(queryResult: QueryResult): string {
        const row = queryResult.rows[0];
        return row.task_id;
    }

}