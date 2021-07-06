export default (req, res) => {
    res.json({
        location: "https://trojan.ngrok.io/dev/oauth/authorize?\n" +
            "&client_id=michal-test-www\n" +
            "&state=1586511942384-OcG\n" +
            "&scope=openid\n" +
            "&response_type=code\n" +
            "&code_challenge=ERNHshyzhznDQOKAIEkJl94N048wMAaN4jY-2xlVy_s\n" +
            "&code_challenge_method=S256\n" +
            "&redirect_uri=https://oauth.tools/callback/code"
    });
}
