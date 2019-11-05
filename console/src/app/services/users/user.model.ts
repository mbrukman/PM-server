export class User {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  phoneNumber: string;
  changePasswordOnNextLogin: boolean;

  constructor(_id: string, name: string, email: string, createdAt: Date, phoneNumber: string) {
    this._id = _id;
    this.name = name;
    this.email = email;
    this.phoneNumber = phoneNumber;
    if (createdAt) {
      this.createdAt = new Date(createdAt);
    }
  }
}
