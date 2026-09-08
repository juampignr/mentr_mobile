// Minimal in-memory stand-in for expo-file-system's new File/Directory API,
// just enough to exercise Compress.mjs's logic.
const fsStore = new Map(); // uri (string) -> Uint8Array

function toUri(pathLike) {
  if (typeof pathLike === "string") return pathLike;
  if (pathLike && typeof pathLike.uri === "string") return pathLike.uri;
  return String(pathLike);
}

export const Paths = { cache: "mock://cache" };

export class File {
  constructor(pathLike, name) {
    this.uri = name ? `${toUri(pathLike)}/${name}` : toUri(pathLike);
  }
  get exists() {
    return fsStore.has(this.uri);
  }
  async bytes() {
    if (!fsStore.has(this.uri)) {
      throw new Error(`ENOENT: no such file, open '${this.uri}'`);
    }
    return fsStore.get(this.uri);
  }
  write(bytes) {
    fsStore.set(this.uri, bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  }
  create() {
    if (!fsStore.has(this.uri)) fsStore.set(this.uri, new Uint8Array());
  }
  delete() {
    fsStore.delete(this.uri);
  }
}

export class Directory {
  constructor(...parts) {
    this.uri = parts.map(toUri).join("/");
  }
  create() {
    /* no-op: directory creation always "succeeds" in this mock */
  }
  createFile(name) {
    return new File(`${this.uri}/${name}`);
  }
  static async pickDirectoryAsync() {
    return new Directory("mock://picked-dir");
  }
}

export function __setMockFile(uri, bytes) {
  fsStore.set(uri, bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}
export function __resetMockFS() {
  fsStore.clear();
}
export function __getMockFile(uri) {
  return fsStore.get(uri);
}
