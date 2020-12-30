export class UserA {

    public id!: any;
    public firstName!: string | undefined;
    public lastName!: string | undefined;
    public email!: string | undefined;
    public jwtToken:string | undefined;
    public locationStr: string | undefined;
    public userType: string | undefined;

      
    constructor(oid?: any, firstName?: string, lastName?:string, email?: string, jwtToken?:string){
        this.id = oid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.jwtToken = jwtToken;
    }

}


export class TaskPoster extends UserA{
    
    public taskPosterId: string | undefined;

    
}

export class Tasker extends UserA{


}