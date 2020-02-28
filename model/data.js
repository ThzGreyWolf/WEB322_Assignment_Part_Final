class userInfo {
    constructor(name, email, password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }
}

class Category {
    constructor(name, img) {
        this.name = name;
        this.img = img;
    }
}

class Product {
    constructor(name, price, img, cat, isBS, qnty, numSold) {
        this.name = name;
        this.price = price;
        this.img = img;
        this.cat = cat;
        this.isBS = isBS;
        this.qnty = qnty;
        this.numSold = numSold;
    }
}

const users = [];
const fakeProductsDB = [];
const categories = [];

categories.push(new Category("cat0", "/img/product/placeholderImg.png"));
categories.push(new Category("cat1", "/img/product/placeholderImg.png"));
categories.push(new Category("cat2", "/img/product/placeholderImg.png"));
categories.push(new Category("cat3", "/img/product/placeholderImg.png"));

users.push(new userInfo("admin", "admin@k1amazon.ca", "adminpass"));
users.push(new userInfo("kiru", "kiru@live.ca", "password"));
users.push(new userInfo("user", "user@gmail.com", "userpass"));

fakeProductsDB.push(new Product("Product0", 13.99, "/img/product/placeholderImg.png", categories[0], false, 10, 1));
fakeProductsDB.push(new Product("Product1", 133.99, "/img/product/placeholderImg.png", categories[1], false, 10, 2));
fakeProductsDB.push(new Product("Product2", 11.99, "/img/product/placeholderImg.png", categories[2], true, 10, 3));
fakeProductsDB.push(new Product("Product3", 3.99, "/img/product/placeholderImg.png", categories[3], false, 10, 4));
fakeProductsDB.push(new Product("Product4", 259.99, "/img/product/placeholderImg.png", categories[2], true, 10, 5));
fakeProductsDB.push(new Product("Product5", 15.99, "/img/product/placeholderImg.png", categories[3], true, 10, 6));
fakeProductsDB.push(new Product("Product6", 25.99, "/img/product/placeholderImg.png", categories[2], false, 10, 6));
fakeProductsDB.push(new Product("Product7", 55.99, "/img/product/placeholderImg.png", categories[1], true, 10, 6));
fakeProductsDB.push(new Product("Product8", 999.99, "/img/product/placeholderImg.png", categories[3], false, 10, 6));

const UserDatabase = {
    getUsers() {
        return users;
    },

    getUser(email) {
        let retVal = null;
        let found = false;
        for(let i = 0; !found && i < users.length; i++) {
            if(users[i].email = email) {
                retVal = users[i];
                found = true;
            }
        }

        return retVal;
    }
}

const FakeDatabase = {
    getCategories() {
        return categories;
    },

    getProducts(numProducts = fakeProductsDB.length) {
        fakeProductsDB.sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();

            let retVal = 0;
            if (nameA > nameB) {
                retVal = 1;
            } else if (nameA < nameB) {
                retVal = -1;
            }
            return retVal;
        });
        return fakeProductsDB.slice(0, numProducts);
    },

    getProductsSorted(sortBy, numProducts = fakeProductsDB.length) {
        switch(sortBy) {
            case "sold":
                fakeProductsDB.sort((a, b) => {
                    return b.numSold - a.numSold;
                });
                break;
            case "bs":
                fakeProductsDB.sort((a, b) => {
                    return b.isBS - a.isBS;
                });
                break;
        }
        
        return fakeProductsDB.slice(0, numProducts);
    },

    getProductsInCat(cat = null) {
        console.log(cat);

        let retVal = this.getProducts();
        if(cat != null) {
            let tempProds = [];
            for(let i = 0; i < fakeProductsDB.length; i++) {
                if(cat == fakeProductsDB[i].cat.name) {
                    tempProds.push(fakeProductsDB[i]);
                }
            }
            retVal = tempProds;
        }

        return retVal;
    }
}

module.exports = UserDatabase;
module.exports = FakeDatabase;