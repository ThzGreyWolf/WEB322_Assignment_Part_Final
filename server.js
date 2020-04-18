const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');
const mailSender = require('@sendgrid/mail');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fileUpload = require('express-fileupload');
const path = require("path");

require('dotenv').config({
    path: "./config/keys.env"
});

const data = require("./model/data");
const userModel = require("./model/user");
const categoryModel = require("./model/category");
const productModel = require("./model/product");

const isLoggedIn = require("./middleware/auth");
const isIC = require("./middleware/icAuth");

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
mailSender.setApiKey(`${process.env.SENDGRID_API_KEY}`);

app.use(express.static("assets"));
app.use(fileUpload());

// ======

app.use(session({
    secret: process.env.SESS_S_KEY,
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.userInfo;
    res.locals.cartItems = req.session.cartItems;
    res.locals.cartTotal = req.session.totalPrice;
    next();
});

// ====== 

app.get("/", (req, res) => {
    categoryModel.find().then((allCats) => {
        const filteredCats = [];
        for(let i = 0; i < 4; i++) {
            filteredCats.push({ 
                id: allCats[i]._id, 
                name: allCats[i].name, 
                img: allCats[i].img 
            });
        }
        productModel.find({isBS:true}).then((allProds) => {
            const filteredProds = [];
            let val = allProds.length > 4 ? 4 : allProds.length;
            for(let i = 0; i < val; i++) {
                filteredProds.push({ 
                    id: allProds[i]._id, 
                    name: allProds[i].name, 
                    img: allProds[i].img 
                });
            }
            res.render("home", {
                title:"Home",
                categories: filteredCats,
                topSold: filteredProds
            });
        }).catch((err) => {
            console.log(`Err getting products: ${err}`);
        });
    }).catch((err) => {
        console.log(`Err getting categories: ${err}`);
    });
});

app.get("/products/:catId", (req, res) => {
    categoryModel.find().then((allCats) => {
        const filteredCats = allCats.map((cat) => {
            return { id: cat._id, name: cat.name, img: cat.image }
        });

        const id = req.params.catId == "all" ? null : {category:req.params.catId};
        productModel.find(id).then((allProds) => {
            const filteredProds = allProds.map((prod) => {
                return { id: prod._id, name: prod.name, img: prod.img, price: prod.price }
            });
            res.render("products", {
                title:"Products",
                products: filteredProds,
                categories: filteredCats
            });
        }).catch((err) => {
            console.log(`Err getting products: ${err}`);
        });
    }).catch((err) => {
        console.log(`Err getting categories: ${err}`);
    });
});

app.get("/prod/:prodId", (req, res) => {
    productModel.findOne({_id:req.params.prodId}).then((fullProd) => {
        const filteredProd =  { 
            id: fullProd._id, 
            name: fullProd.name,
            desc: fullProd.desc,
            qnty: fullProd.quantity, 
            img: fullProd.img, 
            price: fullProd.price };

        res.render("prodDetails", {
            title:filteredProd.name,
            product: filteredProd
        });
    }).catch((err) => {
        console.log(`Err getting products: ${err}`);
    });
});

app.get("/login", (req, res) => {
    if(req.session.userInfo) {
        res.redirect("/accHome");
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

app.get("/addProd", isLoggedIn, isIC, (req, res) => {
    categoryModel.find().then((allCats) => {
        const filteredCats = allCats.map((cat) => {
            return { id: cat._id, name: cat.name, img: cat.image }
        });
        res.render("addProd", {
            title: "Add Product",
            categories: filteredCats
        });
    }).catch((err) => {
        console.log(`Err getting categories: ${err}`);
    });
});

app.get("/placeOrder", isLoggedIn, (req, res) => {
    let mailHtml = 
    `<h2>Thank you ${req.session.userInfo.name} for your order.</h2>
    <br>
    <h4>Order Details</h4>
    <br>
    <table border="1" style="text-align: center;">
        <thead>
            <th>Name</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
        </thead>
        <tbody>`;
        
    for(let i = 0; i < req.session.cartItems.length; i++) {
        let item = req.session.cartItems[i];
        mailHtml += `<tr><td>${item.name}</td><td>CDN$ ${item.price}</td><td>${item.quty}</td><td>CDN$ ${item.total}</td></tr>`;
    }

    mailHtml += `<tr><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td>Order Total:</td><td>CDN$ ${req.session.totalPrice}</td></tr>
    </tbody>
    </table>`;

    const mail = {
        to: req.session.userInfo.email,
        from: `karuldas1@myseneca.ca`,
        subject: `Order reciept`,
        html: mailHtml
    };

    mailSender.send(mail).then(() => {
        req.session.cartItems = null;
        req.session.totalPrice = null;
        res.redirect("/");
    }).catch(err => {
        console.log(`Error ${err}`);
    });
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
                tempUser = {
                    name: name,
                    email: email,
                    password: password
                }

                const user = new userModel(tempUser);
                user.save().then(() => {
                    req.session.userInfo = user;
                    res.redirect("/accHome");
                }).catch((err) => {
                    console.log(`MDB add user err: ${err}`);
                });
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

app.post("/addProd", isLoggedIn, isIC, (req, res) => {
    const {name, price, desc, category, qnty, isBS} = req.body;
    let image = null;
    if(req.files) {
        image = req.files.image;
    }

    let nameErr = "";
    let descErr = "";
    let imgErr = "";

    if(name == "") { nameErr = "Product must have a name"; }
    if(desc == "") { descErr = "Product must have a description"; }
    if(!image) { imgErr = "Product must have an image"; } else {
        if(!image.mimetype.includes("jpeg") && image.mimetype.includes("jpg") && !image.mimetype.includes("png")) {
            imgErr = "The image must be a JPEG or a PNG";
        }
    }

    if(!nameErr && !descErr && !imgErr) {
        image.name = `${req.session.userInfo._id}${image.name}${path.parse(image.name).ext}`;
        image.mv(`assets/img/product/${image.name}`).then(() => {
            tempProd = {
                name: name,
                price: price,
                desc: desc,
                img: `/img/product/${image.name}`,
                category: category,
                isBS: isBS,
                quantity: qnty
            }

            const prod = new productModel(tempProd);
            prod.save().then(() => {
                res.redirect("/addProd");
            }).catch((err) => {
                console.log(`MDB add prod err: ${err}`);
            });
        }).catch((err) => {
            console.log(`${err}`);
        });
    } else {
        categoryModel.find().then((allCats) => {
            const filteredCats = allCats.map((cat) => {
                return { id: cat._id, name: cat.name, img: cat.image }
            });
            res.render("addProd", {
                title: "Add Product",
                categories: filteredCats,
                nameErr: nameErr,
                descErr: descErr,
                imgErr: imgErr
            });
        }).catch((err) => {
            console.log(`Err getting categories: ${err}`);
        });
    }
});

app.post("/addToCart/:prodId", isLoggedIn, (req, res) => {
    productModel.findById(req.params.prodId).then((prod) => {
        const tempCartObj = {
            name: prod.name,
            price: prod.price,
            img: prod.img,
            quty: req.body.qnty,
            total: (prod.price * req.body.qnty)
        }
        
        if(req.session.cartItems) {
            req.session.cartItems.push(tempCartObj);
        } else {
           req.session.cartItems = [tempCartObj]; 
        }

        if(req.session.totalPrice) {
            req.session.totalPrice += tempCartObj.total;
        } else {
           req.session.totalPrice = tempCartObj.total; 
        }
  
        res.redirect('back');
    }).catch((err) => {
        console.log(`${err}`);
    });
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