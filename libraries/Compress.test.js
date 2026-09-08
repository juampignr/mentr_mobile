import { compressBackup, decompressBackup } from "./Compress.js";
import {
  __setMockFile,
  __resetMockFS,
  __getMockFile,
} from "./__mocks__/expo-file-system.js";
import { __setMockDocumentResult } from "./__mocks__/expo-document-picker.js";
import { gzipSync, gunzipSync } from "fflate";

beforeEach(() => {
  __resetMockFS();
});

describe("compressBackup", () => {
  it("throws when given a path that doesn't exist", async () => {
    // dbFile.exists is checked but the current code does nothing with the
    // result (`if (!dbFile.exists) { /* Do something here later! */ }`), so
    // it falls through to dbFile.bytes(), which is what actually throws.
    await expect(compressBackup("mock://does-not-exist/mentr.db")).rejects.toThrow();
  });

  it("compresses an existing but empty mentr.db without error", async () => {
    __setMockFile("mock://cache/mentr.db", new Uint8Array());

    const outUri = await compressBackup("mock://cache/mentr.db");

    expect(outUri).toBe("mock://picked-dir/mentr.db.gz");
    const written = __getMockFile(outUri);
    expect(written).toBeInstanceOf(Uint8Array);
    expect(written.length).toBeGreaterThan(0); // gzip header/footer exist even for empty input
  });

  it("round-trips real (non-empty) db bytes through gzip", async () => {
    const original = new TextEncoder().encode("fake sqlite file contents");
    __setMockFile("mock://cache/mentr.db", original);

    const outUri = await compressBackup("mock://cache/mentr.db");
    const compressed = __getMockFile(outUri);

    expect(gunzipSync(compressed)).toEqual(original);
  });
});

describe("decompressBackup", () => {
  it("throws if the user cancels the file picker", async () => {
    __setMockDocumentResult({ canceled: true });

    await expect(decompressBackup()).rejects.toThrow("User cancelled file selection");
  });

  it("throws on a completely empty .gz file (invalid gzip data)", async () => {
    __setMockFile("mock://picked/mentr.db.gz", new Uint8Array()); // zero bytes
    __setMockDocumentResult({
      canceled: false,
      assets: [{ uri: "mock://picked/mentr.db.gz" }],
    });

    await expect(decompressBackup()).rejects.toThrow();
  });

  it("succeeds with a valid .gz wrapping an empty mentr.db", async () => {
    const emptyGz = gzipSync(new Uint8Array());
    __setMockFile("mock://picked/mentr.db.gz", emptyGz);
    __setMockDocumentResult({
      canceled: false,
      assets: [{ uri: "mock://picked/mentr.db.gz" }],
    });

    const outUri = await decompressBackup();

    const restored = __getMockFile(outUri);
    expect(restored.length).toBe(0);
  });

  it("succeeds with a valid .gz wrapping real db bytes", async () => {
    const original = new TextEncoder().encode("fake sqlite file contents");
    __setMockFile("mock://picked/mentr.db.gz", gzipSync(original));
    __setMockDocumentResult({
      canceled: false,
      assets: [{ uri: "mock://picked/mentr.db.gz" }],
    });

    const outUri = await decompressBackup();

    expect(__getMockFile(outUri)).toEqual(original);
  });

  it("throws a clear error if the picked file is missing from disk", async () => {
    __setMockDocumentResult({
      canceled: false,
      assets: [{ uri: "mock://picked/ghost.gz" }], // never written to the mock FS
    });

    await expect(decompressBackup()).rejects.toThrow("Selected file not found");
  });
});
