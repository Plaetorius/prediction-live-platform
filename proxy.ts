import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Block static asset requests from reaching stream routes
  if (pathname.startsWith('/streams/') && pathname.includes('.')) {
    // This is likely a static asset request being caught by the dynamic route
    // (e.g., source maps from embedded Twitch/YouTube players)
    return new NextResponse('Not Found', { status: 404 });
  }
  
  // Let everything else pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
