import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionProfile } from "@/lib/session";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation/vehicle";

export const dynamic = "force-dynamic";

/**
 * Issues short-lived upload tokens so the browser can send photos straight to Vercel Blob
 * (avoids the serverless body-size limit). A token is only granted to a signed-in seller,
 * for their own vehicle, for image types up to 5 MB, inside vehicles/<userId>/<vehicleId>/.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getSessionProfile();
        if (!user) throw new Error("Please sign in.");
        const vehicleId = (JSON.parse(clientPayload ?? "{}") as { vehicleId?: string }).vehicleId ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(vehicleId)) throw new Error("Invalid listing.");
        if (!pathname.startsWith(`vehicles/${user.id}/${vehicleId}/`) || pathname.includes("..")) throw new Error("Invalid upload path.");
        const own = await queryOne("select 1 from vehicles where id = $1 and seller_id = $2 and status <> 'sold'", [vehicleId, user.id]);
        if (!own) throw new Error("Listing not found.");
        return {
          allowedContentTypes: [...IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Photos are recorded by the attachImages server action after the browser finishes uploading.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
