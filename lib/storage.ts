export const StorageUtils = {
  // Get data from local storage
  getFromStorage(key: string): any {
    if (typeof localStorage !== "undefined") {
      const storedData = localStorage.getItem(key);
      return storedData ? JSON.parse(storedData) : null;
    } else {
      console.warn("localStorage is not available.");
      return null;
    }
  },

  // Set data in local storage
  setInStorage(key: string, data: any): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      console.warn("localStorage is not available. Data not stored.");
    }
  },

  // Remove data from local storage
  removeFromStorage(key: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      console.warn("localStorage is not available. Data not removed.");
    }
  },
};
