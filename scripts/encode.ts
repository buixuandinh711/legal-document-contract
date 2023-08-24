import * as fs from "fs";
import * as zlib from "zlib";

async function compressFile(inputFilePath: string): Promise<string> {
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

async function decompressAndSaveToFile(
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

async function readFileBase64(pdfFilePath: string): Promise<string> {
  try {
    // Read the PDF file as a binary buffer
    const pdfData = await fs.promises.readFile(pdfFilePath);

    // Encode the binary data to base64
    const base64String = pdfData.toString("base64");

    return base64String;
  } catch (err) {
    console.error("Error reading or encoding the PDF file:", err);
    throw err;
  }
}

async function main() {
  const notzipData = await readFileBase64("./cardano.pdf");
  console.log(notzipData.length);
  const res = await compressFile("./cardano.pdf");
  console.log(res.length);
  await decompressAndSaveToFile(res, "out.pdf");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
