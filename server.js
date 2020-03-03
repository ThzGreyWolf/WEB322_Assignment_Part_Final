// TODO: Figure out another way
let loggedIn = false;
let userEmail = null;

const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');
const mailSender = require('@sendgrid/mail');

require('dotenv').config({
    path: "./config/keys.env"
});

const data = require("./model/data");

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
mailSender.setApiKey(`${process.env.SENDGRID_API_KEY}`);

app.use(express.static("assets"));

app.get("/", (req, res) => {
    res.render("home", {
        title:"Home",
        categories: data.getCategories(),
        topSold: data.getProductsSorted("bs", 4),
        loggedIn: loggedIn,
        user: data.getUser(userEmail)
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
    if(loggedIn) {
        res.redirect("/");
    } else {
        res.render("login", {
            title:"Log In",
            logInMode: true
        });
    }
});

app.get("/createAcc", (req, res) => {
    res.render("login", {
        title:"Create Account",
        logInMode: false
    });
});

app.get("/accHome", (req, res) => {
    res.render("acc", {
        title: "Account",
        summary: true,
        orders: false,
        user: data.getUser(userEmail)
    });
});

app.get("/accOrd", (req, res) => {
    res.render("acc", {
        title: "Account",
        summary: false,
        orders: true
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
        res.redirect("/");
    }
});

app.post("/createAcc", (req, res) => {
    const {name, email, password, passwordConf} = req.body;

    let nameNull = false;
    let emailErrMess = "";
    let passErrMess = "";
    let rePassErrMess = "";

    if(name == "") { nameNull = true; }

    if(email == "") { 
        emailErrMess = "Enter your Email";
    } else if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        emailErrMess = "Email not Valid";
    }

    if(password == "") { 
        passErrMess = "Enter a Password"; 
    } else {
        if(!/[a-z]/g.test(password)) {
            passErrMess += "Password must have a lowercase charactor";
        }

        if(!/[A-Z]/g.test(password)) {
            if(passErrMess == "") {
                passErrMess += "Password must have an uppercase charactor";
            } else {
                passErrMess += ", an uppercase charactor";
            }
        }

        if(!/[0-9]/g.test(password)) {
            if(passErrMess == "") {
                passErrMess += "Password must have a numeric value";
            } else {
                passErrMess += ", a numeric value";
            }
        }

        if(!/[a-zA-Z0-9]{8,}/g.test(password)) {
            if(passErrMess == "") {
                passErrMess += "Password must be a 8 charactors or longer, without spaces";
            } else {
                passErrMess += ", and be 8 charactors or longer, without spaces";
            }
        }
    }

    if(passwordConf == "") { 
        rePassErrMess = "Re enter your Password";
    } else if (password != passwordConf){
        rePassErrMess = "Passwords much match";
    }

    if(!nameNull && emailErrMess == "" && passErrMess == "" && rePassErrMess == "") {
        const mail = {
            to: email,
            from: `karuldas1@myseneca.ca`,
            subject: `Thank you for creating an Amazon account`,
            html: `<strong>Welcome ${name} to Amazon, Where products are unreal.</strong>`
        };

        mailSender.send(mail).then(() => {
            logedIn = true;
            userEmail = email;

            tempUser = {
                name: name,
                email: email,
                password: password
            }
            data.addUser(tempUser);
            
            res.redirect("/accHome");
        }).catch(err => {
            console.log(`Error ${err}`);
        });
    } else {
        res.render("login", {
            title:"Create Account",
            logInMode: false,
            nameVal: name,
            emailVal: email,
            passVal: password,
            rePassVal: passwordConf,
            nameErr: nameNull,
            emailErr: emailErrMess,
            passErr: passErrMess,
            rePassErr: rePassErrMess
        });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("Server active!!!");
});