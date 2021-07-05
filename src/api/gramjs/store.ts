import {ApiChat, ApiMessage, ApiUser} from "../types";

class LocalStore {
  public chats: ApiChat[] = [];
  private messages: Record<number, ApiMessage[]> = {};
  public users: ApiUser[] = [];


  public getMessages(chatId: number) : ApiMessage[] {
    return this.messages[chatId] || [];
  }

  public getUsers() : ApiUser[] {
    return this.users;
  }

  public getChats() : ApiChat[] {
    return this.chats;
  }

  public processMessage(message: ApiMessage) {
    const chatId = message.chatId;
    if (!(chatId in this.messages)) {
      this.messages[chatId] = [];
    }
    this.messages[chatId].push(message);
  }

  public addUser(user: ApiUser) {
    this.users.push(user);
  }

  public addChat(chat: ApiChat) {
    this.chats.push(chat);
  }
}

export default new LocalStore();
