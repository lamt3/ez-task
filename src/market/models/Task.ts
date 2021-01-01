export class Task{
    taskId: string | undefined;
    taskType: string | undefined;
    userId: any;
    status: string | undefined;
    title: string | undefined;
    description: string | undefined;
    mustHaves: string | undefined;
    amount: number | undefined;
    currency: string | undefined;
    locationStr: string | undefined;
    lat: number | undefined;
    long: number | undefined;
    createdDate: Date | undefined;
    updatedDate: Date | undefined;
    comments: TaskComment[] | undefined;

}

class TaskType{
    REPAIR = 'repair';
    MOVING = 'moving';
    TUTOR = 'tutor';
    CLEANING = 'cleaning';
    INSTALLATION = 'installation'
}

export class TaskComment{
    commentId: string | undefined;
    taskId: string | undefined;
    message: string | undefined;
    createdDate: Date | undefined;
    replies: TaskComment[] | undefined; 
}