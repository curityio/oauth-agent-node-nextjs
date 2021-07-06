export default (req, res) => {
    res.json({
        cookies: req.cookies
    });
}
