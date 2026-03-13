import { gzipSync, gunzipSync } from "fflate";
import { File, Directory, Paths } from "expo-file-system";
import { getDocumentAsync } from "expo-document-picker";

export async function compressBackup(sourcePath, destPath) {
  const dbFile = new File(sourcePath);

  if (!dbFile.exists) {
    //Do something here later!
  }

  const dbBytes = await dbFile.bytes();
  const compressedBytes = gzipSync(dbBytes);

  const pickedDir = await Directory.pickDirectoryAsync();

  console.log(pickedDir.uri);

  const outFile = pickedDir.createFile("mentr.db.gz", "application/x-gzip");

  outFile.write(compressedBytes);

  return outFile.uri;
}

export async function decompressBackup() {
  const result = await getDocumentAsync({
    type: ["application/gzip", "application/x-gzip", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    throw new Error("User cancelled file selection");
  }

  const picked = result.assets[0];
  const gzFile = new File(picked.uri);

  if (!gzFile.exists) {
    throw new Error(`Selected file not found: ${picked.uri}`);
  }

  const compressedBytes = await gzFile.bytes();
  const dbBytes = gunzipSync(compressedBytes);

  const restoreDir = new Directory(Paths.cache, "mentr_restore");
  restoreDir.create({ idempotent: true, intermediates: true });

  const outFile = new File(restoreDir, "mentr.db");
  outFile.create({ overwrite: true });
  outFile.write(dbBytes);

  console.log(outFile.uri);
  return outFile.uri;
}
