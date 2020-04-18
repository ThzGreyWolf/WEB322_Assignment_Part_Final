const isIC = (req, res, next) => {
    if(req.session.userInfo.ic) {
        next();
    } else {
        res.redirect("/accHome");
    }
}

module.exports = isIC;