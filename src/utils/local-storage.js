const { localStorage } = window;

export default {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? null : JSON.parse(value);
    } catch (error) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      // ignore
    }
  },
};
