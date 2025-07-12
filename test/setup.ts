if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str: string): string => {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (error) {
      const domError = new Error(
        'The string to be encoded contains invalid characters.'
      ) as Error & { name: string };
      domError.name = 'InvalidCharacterError';
      throw domError;
    }
  };
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (str: string): string => {
    try {
      // Validate base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
        const domError = new Error(
          'The string to be decoded is not correctly encoded.'
        ) as Error & { name: string };
        domError.name = 'InvalidCharacterError';
        throw domError;
      }
      return Buffer.from(str, 'base64').toString('binary');
    } catch (error) {
      if (error instanceof Error && error.name === 'InvalidCharacterError') {
        throw error;
      }
      const domError = new Error(
        'The string to be decoded is not correctly encoded.'
      ) as Error & { name: string };
      domError.name = 'InvalidCharacterError';
      throw domError;
    }
  };
}
