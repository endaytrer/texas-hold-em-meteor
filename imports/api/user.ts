import { Mongo } from 'meteor/mongo';

export class User {
  [x: string]: any;
  constructor(
    public connectionId: string,
    public username: string,
    public roomName: string
  ) {}
}

export const UsersCollection = new Mongo.Collection<User>('users');
