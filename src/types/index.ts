export interface DoldApp {
  Bindings: {
    DOLD: KVNamespace;
  };
}

export interface Meta {
  title: string;
  description?: string;
}

export interface StoredCiphertext {
  encrypted: string;
  iv: string;
}

export interface StoredKey {
  key: JsonWebKey;
}
