// Setup Admin Disabled by Antigravity for Security
export async function GET() {
  return new Response("This setup route has been disabled for security. Please delete this file.", { status: 403 });
}
