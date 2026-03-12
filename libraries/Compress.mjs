import { gzipSync, gunzipSync } from "fflate";
import { File, Directory } from "expo-file-system";

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

  console.log(destPath.uri);

  outFile.write(compressedBytes);

  return outFile.uri;
}

export async function decompressBackup(dbPath) {
  const gzFile = new File(dbPath);

  if (!gzFile.exists) {
    throw new Error(`Compressed backup not found: ${gzPath}`);
  }

  const compressedBytes = await gzFile.bytes();
  const dbBytes = gunzipSync(compressedBytes);

  const outPath = gzPath.endsWith(".gz") ? gzPath.slice(0, -3) : `${gzPath}.db`;

  const outFile = new File(outPath);

  if (outFile.exists) {
    outFile.delete();
  }

  outFile.create();
  outFile.write(dbBytes);

  return outPath;
}
