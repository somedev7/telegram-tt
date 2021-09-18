import {ApiChat, ApiMessage, ApiUser} from "../types";
import {IDBPDatabase, openDB, DBSchema} from 'idb';
import {getGlobal} from "../../lib/teact/teactn";

const DB_NAME = 'store';
const STORE_NAME_MESSAGES = 'messages';
const STORE_NAME_CHATS = 'chats';
const STORE_NAME_USERS = 'users';

interface StoreDb extends DBSchema {
  [STORE_NAME_MESSAGES]: {
    value: ApiMessage[],
    key: number
  },
  [STORE_NAME_CHATS]: {
    value: ApiChat,
    key: number
  },
  [STORE_NAME_USERS]: {
    value: ApiUser,
    key: number
  }
}

class LocalStore {
  public chats: ApiChat[] = [];
  private messages: Record<number, ApiMessage[]> = {};
  public users: ApiUser[] = [];
  private db: IDBPDatabase<StoreDb> | null = null;

  async init() {
    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME_MESSAGES);
        db.createObjectStore(STORE_NAME_CHATS);
        db.createObjectStore(STORE_NAME_USERS);
      }
    });
  }

  public async getMessages(chatId: number) : Promise<ApiMessage[]> {
    const messages = await this.db!.get(STORE_NAME_MESSAGES, chatId);
    console.log('idb messages', messages);
    return messages || [];
    // return this.messages[chatId] || [];
  }

  public async getUsers() {
    let users = await this.db!.getAll(STORE_NAME_USERS);
    console.log('idb users', users);
    return users;
  }

  public async getChats() {
    let chats = await this.db!.getAll(STORE_NAME_CHATS);
    console.log('idb chats', chats);
    return chats;
  }

  public async processMessage(message: ApiMessage) {
    let messages = await this.db!.get(STORE_NAME_MESSAGES, message.chatId);
    if (!messages) {
      messages = [];
    }
    messages.push(message);
    await this.db!.put(STORE_NAME_MESSAGES, messages, message.chatId);


    /*const chatId = message.chatId;
    if (!(chatId in this.messages)) {
      this.messages[chatId] = [];
    }
    this.messages[chatId].push(message);
    console.log('message', JSON.stringify(message));*/
  }

  public async updateMessage(chatId: number, localId: number, newMessage: ApiMessage) {
    let messages = await this.db!.get(STORE_NAME_MESSAGES, chatId);
    if (!messages) {
      messages = [];
    }
    let index = messages.findIndex(msg => msg.id === localId);
    if (index > -1) {
      console.log('store.updateMessage', newMessage);
      messages[index] = newMessage;
    }
    await this.db!.put(STORE_NAME_MESSAGES, messages, chatId);
  }

  public async saveUser(user: ApiUser) {
    if (!user) {
      return;
    }
    await this.db!.put(STORE_NAME_USERS, user, user.id);
  }

  public async saveChat(chat: ApiChat) {
    console.log('saveChat');
    if (!chat) {
      return;
    }
    await this.db!.put(STORE_NAME_CHATS, chat, chat.id);
  }
}

const localStore = new LocalStore();
localStore.init();

// WARNING: it might be a situation when store not initialized yet, but imported and used, \
// but we hope that this situation won't happen =)
export default localStore;
