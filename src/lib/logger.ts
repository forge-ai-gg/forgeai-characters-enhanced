export const logger = {
  info: (message: string, data?: any) => {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  },
  error: (message: string, data?: any) => {
    if (data) {
      console.error(message, data);
    } else {
      console.error(message);
    }
  },
  warn: (message: string, data?: any) => {
    if (data) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  },
  debug: (message: string, data?: any) => {
    if (data) {
      console.debug(message, data);
    } else {
      console.debug(message);
    }
  },
};
