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
    res.render("login", {
        title:"Create Account",
        logInMode: false
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server active!!!");
});