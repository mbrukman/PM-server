export class User {
  // tslint:disable-next-line:variable-name
  _id?: string;
  name: string;
  email: string;
  dateCreated: Date;

  constructor({_id, name, email, dataCreated}) {
    this._id = _id;
    this.name = name;
    this.email = email;
    if (dataCreated) {
      this.dateCreated = new Date(dataCreated);
    }
  }
}
