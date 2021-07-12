export const prepareBotApiChatId = (id: number): number => {
  if (id < 0) {
    return id - 1000000000000;
  }
  return id;
};
