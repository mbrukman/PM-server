export class FilterOptions{
    globalFilter?: string ;
    isArchived?:boolean;
    sort:string = '-createdAt';
    limit? : number;
    filter?:any;
    page?:number = 1 
}