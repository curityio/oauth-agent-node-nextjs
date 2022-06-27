import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import runMiddleware from "../../src/supportability/runMiddleware";
import loggingMiddleware from "../../src/supportability/loggingMiddleware";
import handleException from "../../src/supportability/handleException";
import {
    decryptCookie,
    getAuthCookieName,
    getCookiesForTokenResponse,
    refreshAccessToken,
    ValidateRequestOptions
} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";

export default async (req: NextApiRequest, res: OauthAgentResponse) => {
    await runMiddleware(req, res, loggingMiddleware)

    try {
        // Check for an allowed origin and the presence of a CSRF token
        const options = new ValidateRequestOptions()
        validateNextRequest(req, options)

        const authCookieName = getAuthCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[authCookieName]) {

            const refreshToken = decryptCookie(config.encKey, req.cookies[authCookieName])
            const tokenResponse = await refreshAccessToken(refreshToken, config)

            const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config)
            res.setHeader('Set-Cookie', cookiesToSet)
            res.status(204).end()

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'No auth cookie was supplied in a token refresh call'
            handleException(error, req, res)
        }
    } catch (error) {
        handleException(error, req, res)
    }
}
