import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import runMiddleware from "../../src/supportability/runMiddleware";
import loggingMiddleware from "../../src/supportability/loggingMiddleware";
import handleException from "../../src/supportability/handleException";
import {getIDCookieName, getIDTokenClaims, ValidateRequestOptions} from "../../src/lib";
import {config} from "../../src/config";
import validateNextRequest from "../../src/validateNextRequest";
import {InvalidCookieException} from "../../src/lib/exceptions";

export default async (req: NextApiRequest, res: OauthAgentResponse) => {
    await runMiddleware(req, res, loggingMiddleware)

    try {
        // Verify the web origin
        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false;
        validateNextRequest(req, options)

        const idTokenCookieName = getIDCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[idTokenCookieName]) {

            const userData = getIDTokenClaims(config.encKey, req.cookies[idTokenCookieName])
            res.status(200).json(userData)

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'No ID cookie was supplied in a call to get claims'
            handleException(error, req, res)
        }
    } catch (error) {
        handleException(error, req, res)
    }
}
