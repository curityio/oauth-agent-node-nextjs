import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import runMiddleware from "../../src/supportability/runMiddleware";
import loggingMiddleware from "../../src/supportability/loggingMiddleware";
import handleException from "../../src/supportability/handleException";
import {getATCookieName, getUserInfo, ValidateRequestOptions} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";

export default async (req: NextApiRequest, res: OauthAgentResponse) => {
    await runMiddleware(req, res, loggingMiddleware)

    try {
        // Verify the web origin
        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false;
        validateNextRequest(req, options)

        const atCookieName = getATCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[atCookieName]) {

            const userData = await getUserInfo(config, config.encKey, req.cookies[atCookieName])
            res.status(200).json(userData)

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'No AT cookie was supplied in a call to get user info'
            handleException(error, req, res)
        }
    } catch (error) {
        handleException(error, req, res)
    }
}
