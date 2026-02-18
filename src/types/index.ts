export type DoldApp = {
  Bindings: {
    DOLD: KVNamespace;
  };
};

export type Meta = {
  title: string;
  description?: string;
};

export type StoredCiphertext = {
  encrypted: string;
  iv: string;
};

export type StoredKey = {
  key: JsonWebKey;
};
