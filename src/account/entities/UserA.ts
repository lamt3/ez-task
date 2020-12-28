export class UserA {

    public id!: any;
    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public jwtToken:string;

    constructor(oid: any, firstName: string, lastName:string, email: string, jwtToken:string){
        this.id = oid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.jwtToken = jwtToken;
    }

}
