// TODO: Figure out another way
let loggedIn = false;
let userEmail = null;

const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');
const mailSender = require('@sendgrid/mail');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

require('dotenv').config({
    path: "./config/keys.env"
});

const data = require("./model/data");
const userModel = require("./model/user");
const isLoggedIn = require("./middleware/auth");

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
mailSender.setApiKey(`${process.env.SENDGRID_API_KEY}`);

app.use(express.static("assets"));

// ======

app.use(session({
    secret: process.env.SESS_S_KEY,
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.userInfo;
    next();
});

// ====== 

app.get("/", (req, res) => {
    res.render("home", {
        title:"Home",
        categories: data.getCategories(),
        topSold: data.getProductsSorted("bs", 4)
        // loggedIn: loggedIn,
        // user: data.getUser(userEmail)
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

app.get("/accHome", isLoggedIn, (req, res) => {
    res.render("acc", {
        title: "Account",
        summary: true,
        orders: false
    });

    // res.render("acc", {
    //     title: "Account",
    //     summary: true,
    //     orders: false,
    //     name: userName
    //     // name: data.getUser(userEmail).name
    // });
});

app.get("/accOrd", isLoggedIn, (req, res) => {
    res.render("acc", {
        title: "Account",
        summary: false,
        orders: true
    });
});

app.get("/logout", isLoggedIn, (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.use(bodyParser.urlencoded({ extended: false }))

app.post("/logIn", (req, res) => {
    let emailMess = "";
    let passMess = ""

    if(req.body.email == "") { emailMess = "Enter your Email"; }
    if(req.body.password == "") { passMess = "Enter your Password"; }

    if(emailMess != "" || passMess != "") {
        res.render("login", {
            title:"Log In",
            logInMode: true,
            emailErr: emailMess,
            passErr: passMess
        });
    } else {
        userModel.findOne({email:req.body.email}).then((user) => {
            if(!user) {
                passMess = "Email and/or password is incorrect";
                emailErrMess = " ";
                res.render("login", {
                    title:"Log In",
                    logInMode: true,
                    emailErr: emailMess,
                    passErr: passMess
                });
            } else {
                bcrypt.compare(req.body.password, user.password).then((success) => {
                    if(!success) {
                        passMess = "Email and/or password is incorrect";
                        emailErrMess = " ";
                        res.render("login", {
                            title:"Log In",
                            logInMode: true,
                            emailErr: emailMess,
                            passErr: passMess
                        });
                    } else {
                        req.session.userInfo = user;
                        res.redirect("/accHome");
                    }
                }).catch((err) => {
                    console.log(`Err compare pass post /logIn: ${err}`)
                });
            }
        }).catch((err) => {
            console.log(`MDB find user err post /logIn: ${err}`);
        });
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
    } else {
        userModel.findOne({email:req.body.email}).then((user) => {
            if(user) { emailErrMess = "An account with this email already exists"; }
        }).catch((err) => {
            console.log(`MDB find user err in post /createAcc: ${err}`);
        });
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
                passErrMess += "Password must be a 8 charactors or longer, without spaces, excluding special characters";
            } else {
                passErrMess += ", and be 8 charactors or longer, without spaces, excluding special characters";
            }
        }
    }

    if(passwordConf == "") { 
        rePassErrMess = "Re enter your Password";
    } else if (password != passwordConf){
        rePassErrMess = "Passwords much match";
    }

    setTimeout(() => {
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
                // data.addUser(tempUser);

                const user = new userModel(tempUser);
                user.save().then(() => {
                    req.session.userInfo = user;
                    res.redirect("/accHome");
                }).catch((err) => {
                    console.log(`MDB add user err: ${err}`);
                });

                // res.redirect("/accHome");
                // res.render("acc", {
                //     title: "Account",
                //     summary: true,
                //     orders: false,
                //     name: name
                // });
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
    }, 3000);
});

mongoose.connect(process.env.MDB_CONN_STR, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    // Callback for successful connection
    console.log(`MDB Conn Successful!`);
}).catch((err) => {
    // Callback for unsuccessful connection
    console.log(`MDB Conn Err: ${err}`);
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("Server active!!!");
});