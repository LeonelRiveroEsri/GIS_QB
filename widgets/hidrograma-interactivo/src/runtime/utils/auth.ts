import { SessionManager } from "jimu-core";

export const PORTAL_URL = "https://teck-qb2.maps.arcgis.com";

export async function getRequiredArcGisSession(resourceUrl?: string) {
  const sessionManager = SessionManager.getInstance();

  let session = sessionManager.getMainSession();

  if (session) {
    return session;
  }

  if (resourceUrl) {
    session = await sessionManager.signInByResourceUrl(
      resourceUrl,
      PORTAL_URL,
      true,
    );
  } else {
    session = await sessionManager.signIn({
      portalUrl: PORTAL_URL,
    });
  }

  return session;
}
