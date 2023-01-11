import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import handleException from "../../src/middleware/handleException";
import {
    decryptCookie,
    getAuthCookieName,
    getCookiesForTokenResponse,
    refreshAccessToken,
    validateIDtoken,
    ValidateRequestOptions
} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";
import MethodNotAllowedException from "../../src/lib/exceptions/MethodNotAllowedException";
import handleCatchingWithLoggingAndCors from "../../src/middleware/handleCathingWithLoggingAndCors";

const handler = async (req: NextApiRequest, res: OauthAgentResponse) => {
    if (req.method === 'POST') {
        await handlePost(req, res)
    } else {
        const error = new MethodNotAllowedException()
        handleException(error, req, res)
    }
}

const handlePost = async (req: NextApiRequest, res: OauthAgentResponse) => {
    // Check for an allowed origin and the presence of a CSRF token
    const options = new ValidateRequestOptions()
    validateNextRequest(req, options)

    const authCookieName = getAuthCookieName(config.cookieNamePrefix)
    if (req.cookies && req.cookies[authCookieName]) {

        const refreshToken = decryptCookie(config.encKey, req.cookies[authCookieName])
        const tokenResponse = await refreshAccessToken(refreshToken, config)
        if (tokenResponse.id_token) {
            validateIDtoken(config, tokenResponse.id_token)
        }

        const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config)
        res.setHeader('Set-Cookie', cookiesToSet)
        res.status(204).end()

    } else {
        const error = new InvalidCookieException()
        error.logInfo = 'No auth cookie was supplied in a token refresh call'
        handleException(error, req, res)
    }
}

export default handleCatchingWithLoggingAndCors(handler)
