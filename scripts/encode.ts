import * as fs from "fs";
import * as zlib from "zlib";

export async function compressFile(inputFilePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const inputReadStream = fs.createReadStream(inputFilePath);
    const chunks: Buffer[] = [];

    const gzipStream = inputReadStream.pipe(zlib.createGzip());

    gzipStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    gzipStream.on("end", () => {
      const compressedData = Buffer.concat(chunks);
      const compressedString = compressedData.toString("base64"); // Convert to a base64 string
      resolve(compressedString);
    });

    gzipStream.on("error", reject);
  });
}

export async function decompressAndSaveToFile(
  compressedBase64: string,
  outputFilePath: string
): Promise<void> {
  const compressedBuffer = Buffer.from(compressedBase64, "base64");

  const decompressedBuffer = await new Promise<Buffer>((resolve, reject) => {
    zlib.gunzip(compressedBuffer, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

  await fs.promises.writeFile(outputFilePath, decompressedBuffer);
}
