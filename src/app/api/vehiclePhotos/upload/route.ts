import { BlobServiceClient } from "@azure/storage-blob";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const connectionString = process.env.AZURE_CONNECTION_STRING;
  const containerName = process.env.AZURE_CONTAINER_NAME;

  if (!connectionString || !containerName) {
    return NextResponse.json(
      { error: "Azure Blob Storage is not configured" },
      { status: 500 }
    );
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure container exists (no-op if already exists)
  await containerClient.createIfNotExists({ access: "blob" });

  const blobName = `vehicle-photos/${uuidv4()}.jpg`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const buffer = Buffer.from(await file.arrayBuffer());

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "image/jpeg" },
  });

  return NextResponse.json({ url: blockBlobClient.url });
}
