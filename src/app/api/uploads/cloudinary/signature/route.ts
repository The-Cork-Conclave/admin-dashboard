import { type NextRequest, NextResponse } from "next/server";

import crypto from "node:crypto";

function parseCloudinaryUrl(raw: string): { cloudName: string; apiKey: string; apiSecret: string } {
  const url = new URL(raw);
  const apiKey = url.username?.trim() ?? "";
  const apiSecret = url.password?.trim() ?? "";
  const cloudName = url.hostname?.trim() ?? "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Invalid CLOUDINARY_URL");
  }

  return { cloudName, apiKey, apiSecret };
}

function signSha1(toSign: string): string {
  return crypto.createHash("sha1").update(toSign).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim() ?? "";
    if (!cloudinaryUrl) {
      return NextResponse.json({ message: "Missing CLOUDINARY_URL" }, { status: 500 });
    }

    const { cloudName, apiKey, apiSecret } = parseCloudinaryUrl(cloudinaryUrl);

    const folder = req.nextUrl.searchParams.get("folder")?.trim() || "cork-conclave";
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signature is SHA1 of the sorted params string + apiSecret.
    // Here we sign only what we send alongside the upload request.
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = signSha1(signatureBase);

    return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign upload";
    return NextResponse.json({ message }, { status: 500 });
  }
}
