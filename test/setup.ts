class InvalidCharacterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCharacterError";
  }
}

if (globalThis.btoa === undefined) {
  globalThis.btoa = (str: string): string => {
    try {
      return Buffer.from(str, "binary").toString("base64");
    } catch {
      throw new InvalidCharacterError(
        "The string to be encoded contains invalid characters."
      );
    }
  };
}

if (globalThis.atob === undefined) {
  globalThis.atob = (str: string): string => {
    try {
      // Validate base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(str)) {
        throw new InvalidCharacterError(
          "The string to be decoded is not correctly encoded."
        );
      }
      return Buffer.from(str, "base64").toString("binary");
    } catch (error) {
      if (error instanceof Error && error.name === "InvalidCharacterError") {
        throw error;
      }
      throw new InvalidCharacterError(
        "The string to be decoded is not correctly encoded."
      );
    }
  };
}
