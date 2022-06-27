import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import runMiddleware from "../../src/supportability/runMiddleware";
import loggingMiddleware from "../../src/supportability/loggingMiddleware";
import {getATCookieName, getCookiesForUnset, getLogoutURL, ValidateRequestOptions} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";
import handleException from "../../src/supportability/handleException";

export default async (req: NextApiRequest, res: OauthAgentResponse) => {

    await runMiddleware(req, res, loggingMiddleware)
    // Check for an allowed origin and the presence of a CSRF token

    try {
        const options = new ValidateRequestOptions()
        validateNextRequest(req, options)

        if (req.cookies && req.cookies[getATCookieName(config.cookieNamePrefix)]) {

            const logoutURL = getLogoutURL(config)
            res.setHeader('Set-Cookie', getCookiesForUnset(config.cookieOptions, config.cookieNamePrefix))
            res.json({ url: logoutURL})

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'No auth cookie was supplied in a logout call'
            handleException(error, req, res)
        }
    } catch (error) {
        handleException(error, req, res)
    }
}
