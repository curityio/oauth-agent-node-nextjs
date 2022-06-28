import {NextApiRequest} from "next";
import urlparse from 'url-parse'
import {
    decryptCookie,
    generateRandomString,
    getATCookieName,
    getCookiesForFailedLoginResponse,
    getCookiesForTokenResponse,
    getCSRFCookieName,
    getTempLoginDataCookieName,
    getTokenEndpointResponse,
    ValidateRequestOptions
} from "../../../src/lib";
import validateNextRequest from "../../../src/validateNextRequest";
import {config} from "../../../src/config";
import loggingMiddleware from "../../../src/supportability/loggingMiddleware";
import runMiddleware from "../../../src/supportability/runMiddleware";
import handleException from "../../../src/supportability/handleException";
import {OauthAgentResponse} from "../../../src/OauthAgentResponse";
import {AuthorizationResponseException} from "../../../src/lib/exceptions";

/*
     * The SPA posts its URL here on every page load, and this operation ends a login when required
     * The API works out whether it is an OAuth response, eg:
     * - code + state query parameters
     * - code + error query parameters
     * - JARM response parameters
     */
export default async (req: NextApiRequest, res: OauthAgentResponse) => {

    await runMiddleware(req, res, loggingMiddleware)

    try {

        // Verify the web origin
        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false
        validateNextRequest(req, options)

        // First see if the SPA is reporting an OAuth front channel response to the browser
        const data = getUrlParts(req.body?.pageUrl)
        const isSuccessOAuthResponse = !!(data.state && data.code)
        const isFailedOAuthResponse = !!(data.state && data.error)

        // First handle reporting front channel errors back to the SPA
        if (isFailedOAuthResponse) {

            res.setHeader('Set-Cookie', getCookiesForFailedLoginResponse(config))
            const error = new AuthorizationResponseException(
                data.error,
                data.error_description || 'Login failed at the Authorization Server')
            return handleException(error, req, res)
        }

        let isLoggedIn: boolean
        let csrfToken: string = ''

        if (isSuccessOAuthResponse) {

            // Main OAuth response handling
            const tempLoginData = req.cookies ? req.cookies[getTempLoginDataCookieName(config.cookieNamePrefix)] : undefined
            const tokenResponse = await getTokenEndpointResponse(config, data.code, data.state, tempLoginData)

            csrfToken = generateRandomString()
            const csrfCookie = req.cookies[getCSRFCookieName(config.cookieNamePrefix)]
            if (csrfCookie) {

                try {
                    // Avoid setting a new value if the user opens two browser tabs and signs in on both
                    csrfToken = decryptCookie(config.encKey, csrfCookie)

                } catch (e) {

                    // If the system has been redeployed with a new cookie encryption key, decrypting old cookies from the browser will fail
                    // In this case generate a new CSRF token so that the SPA can complete its login without errors
                    csrfToken = generateRandomString()
                }
            } else {

                // By default generate a new token
                csrfToken = generateRandomString()
            }

            // Write the SameSite cookies
            const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config, true, csrfToken)
            res.setHeader('Set-Cookie', cookiesToSet)
            isLoggedIn = true

        } else {

            // See if we have a session cookie
            isLoggedIn = !!(req.cookies && req.cookies[getATCookieName(config.cookieNamePrefix)])
            if (isLoggedIn) {

                // During an authenticated page refresh or opening a new browser tab, we must return the anti forgery token
                // This enables an XSS attack to get the value, but this is standard for CSRF tokens
                csrfToken = decryptCookie(config.encKey, req.cookies[getCSRFCookieName(config.cookieNamePrefix)])
            }
        }

        // isLoggedIn enables the SPA to know it does not need to present a login option
        // handled enables the SPA to know a login has just completed
        const responseBody = {
            handled: isSuccessOAuthResponse,
            isLoggedIn,
        } as any

        // The CSRF token is required for subsequent operations and calling APIs
        if (csrfToken) {
            responseBody.csrf = csrfToken
        }

        res.status(200).json(responseBody)
    } catch (error) {
        handleException(error, req, res)
    }
}

const getUrlParts = (url?: string): any => {

    if (url) {
        const urlData = urlparse(url, true)
        if (urlData.query) {
            return urlData.query
        }
    }

    return {}
}
