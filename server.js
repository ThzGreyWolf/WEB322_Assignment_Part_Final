const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');

const data = require("./model/data");

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static("assets"));

app.get("/", (req, res) => {
    res.render("home", {
        title:"Home",
        categories: data.getCategories(),
        topSold: data.getProductsSorted("bs", 4)
    });
});

app.get("/products", (req, res) => {
    res.render("products", {
        title:"Products",
        products: data.getProducts(),
        categories: data.getCategories()
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        title:"Log In",
        logInMode: true
    });
});

app.get("/createAcc", (req, res) => {
    res.render("login", {
        title:"Create Account",
        logInMode: false
    });
});

app.use(bodyParser.urlencoded({ extended: false }))

app.post("/logIn", (req, res) => {
    let emailNull = false;
    let passNull = false

    if(req.body.email == "") { emailNull = true; }
    if(req.body.password == "") { passNull = true; }

    if(emailNull || passNull) {
        res.render("login", {
            title:"Log In",
            logInMode: true,
            emailErr: emailNull,
            passErr: passNull
        });
    } else {
        res.render("home", {
            title:"Home",
            categories: data.getCategories(),
            topSold: data.getProductsSorted("bs", 4)
        });
    }
});

app.post("/createAcc", (req, res) => {
    let nameNull = false;

    let nameVal = "";
    let emailVal = "";
    let passVal = "";
    let rePassVal = "";

    let emailErrMess = "";
    let passErrMess = "";
    let rePassErrMess = "";

    if(req.body.name == "") { nameNull = true; } else { nameVal = req.body.name; }

    if(req.body.email == "") { 
        emailErrMess = "Enter your Email";
    } else if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) {
        emailErrMess = "Email not Valid";
    } else {
        emailVal = req.body.email;
    }

    let err = 0;
    if(req.body.password == "") { 
        passErrMess = "Enter a Password"; 
    } else {
        if(!/[a-z]/g.test(req.body.password)) {
            passErrMess += "Password must have a lowercase charactor";
            err = 1;
        }

        if(!/[A-Z]/g.test(req.body.password)) {
            if(passErrMess == "") {
                passErrMess += "Password must have an uppercase charactor";
            } else {
                passErrMess += ", an uppercase charactor";
            }
            err = 1;
        }

        if(!/[0-9]/g.test(req.body.password)) {
            if(passErrMess == "") {
                passErrMess += "Password must have a numeric value";
            } else {
                passErrMess += ", a numeric value";
            }
            err = 1;
        }

        if(!/[a-zA-Z0-9]{8,}/g.test(req.body.password)) {
            if(passErrMess == "") {
                passErrMess += "Password must be a 8 charactors or longer, without spaces";
            } else {
                passErrMess += ", and be 8 charactors or longer, without spaces";
            }
            err = 1;
        }
    }
    if(err == 0) { 
        passErrMess = "";
        passVal = req.body.password;
    }

    if(req.body.passwordConf == "") { 
        rePassErrMess = "Re enter your Password";
    } else if (req.body.password != req.body.passwordConf){
        rePassErrMess = "Passwords much match";
    } else {
        rePassVal = req.body.passwordConf;
    }

    res.render("login", {
        title:"Create Account",
        logInMode: false,
        nameVal: nameVal,
        emailVal: emailVal,
        passVal: passVal,
        rePassVal: rePassVal,
        nameErr: nameNull,
        emailErr: emailErrMess,
        passErr: passErrMess,
        rePassErr: rePassErrMess
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server active!!!");
});