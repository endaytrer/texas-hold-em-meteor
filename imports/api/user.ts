import { Mongo } from 'meteor/mongo';

export class User {
  [x: string]: any;
  username: string | undefined;
  room: string | undefined;
  constructor(public connectionId: string) {}
  static joinRoom(user: User, username: string, room: string) {
    user.username = username;
    user.room = room;
  }
}

export const UsersCollection = new Mongo.Collection<User>('users');
