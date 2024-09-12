var express = require("express");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;
const bcrypt = require('bcrypt');


const verifySignedIn = (req, res, next) => {
  if (req.session.signedInAdmin) {
    next();
  } else {
    res.redirect("/admin/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/home", { admin: true, products, layout: 'admin', administator });
  });
});



// GET route to display the change password form for admin
router.get('/change-password/:id', verifySignedIn, async (req, res) => {
  res.render('admin/change-password', {
    administator: req.session.admin,
    layout: 'admin',
    admin: true
  });
});

// POST route to handle password update for admin
router.post('/change-password/:id', verifySignedIn, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  let errors = [];

  try {
    let admin = await adminHelper.getAdminDetails(req.params.id);

    // Validate current password
    const passwordMatch = await bcrypt.compare(currentPassword, admin.Password);
    if (!passwordMatch) {
      errors.push("Current password is incorrect.");
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      errors.push("New password must be at least 6 characters long.");
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      errors.push("New password and confirmation do not match.");
    }

    // If there are validation errors, re-render the form
    if (errors.length > 0) {
      return res.render('admin/change-password', {
        administator: req.session.admin,
        layout: 'admin',
        errors,
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await adminHelper.updateAdminPassword(req.params.id, hashedPassword);

    // Redirect to admin profile after successful password update
    res.redirect('/admin');
  } catch (err) {
    console.error('Admin password update error:', err);
    res.status(500).send('An error occurred while updating the password.');
  }
});

///////ALL staff/////////////////////                                         
router.get("/all-staffs", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllstaffs().then((staffs) => {
    res.render("admin/staff/all-staffs", { admin: true, layout: "admin", staffs, administator });
  });
});

router.post("/approve-staff/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.STAFF_COLLECTION).updateOne(
    { _id: ObjectId(req.params.id) },
    { $set: { approved: true } }
  );
  res.redirect("/admin/all-staffs");
});

router.post("/reject-staff/:id", function (req, res) {
  const staffId = req.params.id;
  db.get()
    .collection(collections.STAFF_COLLECTION)
    .updateOne({ _id: ObjectId(staffId) }, { $set: { approved: false, rejected: true } })
    .then(() => {
      res.redirect("/admin/all-staffs");
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/admin/all-staffs");
    });
});


router.post("/delete-staff/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.STAFF_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/all-staffs");
});

///////ADD staff/////////////////////                                         
router.get("/add-staff", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/staff/add-staff", { admin: true, layout: "admin", administator });
});

///////ADD staff/////////////////////                                         
router.post("/add-staff", function (req, res) {
  adminHelper.addstaff(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/staff-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/staff/all-staffs");
      } else {
        console.log(err);
      }
    });
  });
});

///////EDIT staff/////////////////////                                         
router.get("/edit-staff/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let staffId = req.params.id;
  let staff = await adminHelper.getstaffDetails(staffId);
  console.log(staff);
  res.render("admin/staff/edit-staff", { admin: true, layout: "admin", staff, administator });
});

///////EDIT staff/////////////////////                                         
router.post("/edit-staff/:id", verifySignedIn, function (req, res) {
  let staffId = req.params.id;
  adminHelper.updatestaff(staffId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/staff-images/" + staffId + ".png");
      }
    }
    res.redirect("/admin/staff/all-staffs");
  });
});

///////DELETE staff/////////////////////                                         
// router.get("/delete-staff/:id", verifySignedIn, function (req, res) {
//   let staffId = req.params.id;
//   adminHelper.deletestaff(staffId).then((response) => {
//     res.redirect("/admin/all-staffs");
//   });
// });

///////DELETE ALL staff/////////////////////                                         
router.get("/delete-all-staffs", verifySignedIn, function (req, res) {
  adminHelper.deleteAllstaffs().then(() => {
    res.redirect("/admin/staff/all-staffs");
  });
});



router.get("/all-products", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/all-products", { admin: true, products, administator });
  });
});

router.get("/signup", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signup", {
      admin: true,
      layout: "adminempty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", function (req, res) {
  adminHelper.doSignup(req.body).then((response) => {
    console.log(response);
    if (response.status == false) {
      req.session.signUpErr = "Invalid Admin Code";
      res.redirect("/admin/signup");
    } else {
      req.session.signedInAdmin = true;
      req.session.admin = response;
      res.redirect("/admin");
    }
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signin", {
      admin: true,
      layout: "adminempty",

      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  adminHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedInAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/admin/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedInAdmin = false;
  req.session.admin = null;
  res.redirect("/admin");
});

router.get("/add-product", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/add-product", { admin: true, administator });
});

router.post("/add-product", function (req, res) {
  adminHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/product-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/add-product");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let productId = req.params.id;
  let product = await adminHelper.getProductDetails(productId);
  console.log(product);
  res.render("admin/edit-product", { admin: true, product, administator });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  adminHelper.deleteAllProducts().then(() => {
    res.redirect("/admin/all-products");
  });
});


router.get("/all-staffs", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllStaffs().then((staffs) => {
    res.render("admin/all-staffs", { admin: true, layout: 'admin', administator, staffs });
  });
});

router.get("/all-users", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllUsers().then((users) => {
    res.render("admin/all-users", { admin: true, layout: 'admin', administator, users });
  });
});

router.get("/remove-user/:id", verifySignedIn, function (req, res) {
  let userId = req.params.id;
  adminHelper.removeUser(userId).then(() => {
    res.redirect("/admin/all-users");
  });
});

router.get("/remove-all-users", verifySignedIn, function (req, res) {
  adminHelper.removeAllUsers().then(() => {
    res.redirect("/admin/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let orders = await adminHelper.getAllOrders();
  res.render("admin/all-orders", {
    admin: true,
    administator,
    orders,
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("admin/order-products", {
      admin: true,
      administator,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, administator, response });
  });
});


module.exports = router;
