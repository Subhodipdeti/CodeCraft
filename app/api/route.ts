import { snapshot } from "@webcontainer/snapshot";

export async function GET() {
  const sourceSnapshot = await snapshot("next13-discord-clone-master");
  return new Response(sourceSnapshot, {
    headers: {
      "content-type": "application/octet-stream",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  });
}
