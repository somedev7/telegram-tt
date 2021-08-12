import {ApiChat, ApiMessage, ApiUser} from "../types";
import {IDBPDatabase, openDB, DBSchema} from 'idb';

const DB_NAME = 'store';
const STORE_NAME = 'messages';

interface StoreDb extends DBSchema {
  [STORE_NAME]: {
    value: ApiMessage[],
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
        db.createObjectStore(STORE_NAME);
      }
    });
  }

  public async getMessages(chatId: number) : Promise<ApiMessage[]> {
    const messages = await this.db!.get(STORE_NAME, chatId);
    console.log('idb messages', messages && messages[messages.length - 1]);
    return messages || [];
    // return this.messages[chatId] || [];
  }

  public getUsers() : ApiUser[] {
    return this.users;
  }

  public getChats() : ApiChat[] {
    return this.chats;
  }

  public async processMessage(message: ApiMessage) {
    let messages = await this.db!.get(STORE_NAME, message.chatId);
    if (!messages) {
      messages = [];
    }
    messages.push(message);
    await this.db!.put(STORE_NAME, messages, message.chatId);


    /*const chatId = message.chatId;
    if (!(chatId in this.messages)) {
      this.messages[chatId] = [];
    }
    this.messages[chatId].push(message);
    console.log('message', JSON.stringify(message));*/
  }

  public addUser(user: ApiUser) {
    this.users.push(user);
  }

  public addChat(chat: ApiChat) {
    this.chats.push(chat);
  }
}

const localStore = new LocalStore();
localStore.init();

// WARNING: it might be a situation when store not initialized yet, but imported and used, \
// but we hope that this situation won't happen =)
export default localStore;
