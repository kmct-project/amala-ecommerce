var express = require("express");
var staffHelper = require("../helper/staffHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;
const bcrypt = require('bcrypt');


const verifySignedIn = (req, res, next) => {
  if (req.session.signedInStaff) {
    next();
  } else {
    res.redirect("/staff/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let staff = req.session.staff;
  res.render("staff/home", { staff: true, layout: "admin", staff });
});


// GET route to display the change password form for staff
router.get('/change-password/:id', verifySignedIn, async (req, res) => {
  res.render('staff/change-password', {
    staff: req.session.staff,
    layout: 'admin',
    admin: false,
  });
});

// POST route to handle password update for staff
router.post('/change-password/:id', verifySignedIn, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  let errors = [];

  try {
    let staff = await staffHelper.getstaffDetails(req.params.id);

    // Validate current password
    const passwordMatch = await bcrypt.compare(currentPassword, staff.Password);
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
      return res.render('staff/change-password', {
        staff: req.session.staff,
        layout: 'admin',
        errors,
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await staffHelper.updatestaffPassword(req.params.id, hashedPassword);

    // Redirect to staff profile after successful password update
    res.redirect('/staff/profile');
  } catch (err) {
    console.error('Staff password update error:', err);
    res.status(500).send('An error occurred while updating the password.');
  }
});

////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let staff = req.session.staff;
  res.render("staff/profile", { staff: true, layout: "admin", staff });
});


///////ALL workspace/////////////////////                                         
// router.get("/all-workspaces", verifySignedIn, function (req, res) {
//   let staff = req.session.staff;
//   staffHelper.getAllworkspaces(req.session.staff._id).then((workspaces) => {
//     res.render("staff/all-workspaces", { admin: true, layout: "admin", workspaces, staff });
//   });
// });

///////ADD workspace/////////////////////                                         
router.get("/add-workspace", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  res.render("staff/add-workspace", { admin: true, layout: "admin", staff });
});

///////ADD workspace/////////////////////                                         
router.post("/add-workspace", function (req, res) {
  // Ensure the staff is signed in and their ID is available
  if (req.session.signedInStaff && req.session.staff && req.session.staff._id) {
    const staffId = req.session.staff._id; // Get the staff's ID from the session

    // Pass the staffId to the addworkspace function
    staffHelper.addworkspace(req.body, staffId, (workspaceId, error) => {
      if (error) {
        console.log("Error adding workspace:", error);
        res.status(500).send("Failed to add workspace");
      } else {
        let image = req.files.Image;
        image.mv("./public/images/workspace-images/" + workspaceId + ".png", (err) => {
          if (!err) {
            res.redirect("/staff/all-workspaces");
          } else {
            console.log("Error saving workspace image:", err);
            res.status(500).send("Failed to save workspace image");
          }
        });
      }
    });
  } else {
    // If the staff is not signed in, redirect to the sign-in page
    res.redirect("/staff/signin");
  }
});


///////EDIT workspace/////////////////////                                         
router.get("/edit-workspace/:id", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let workspaceId = req.params.id;
  let workspace = await staffHelper.getworkspaceDetails(workspaceId);
  console.log(workspace);
  res.render("staff/edit-workspace", { admin: true, layout: "admin", workspace, staff });
});

///////EDIT workspace/////////////////////                                         
router.post("/edit-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  staffHelper.updateworkspace(workspaceId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/workspace-images/" + workspaceId + ".png");
      }
    }
    res.redirect("/staff/all-workspaces");
  });
});

///////DELETE workspace/////////////////////                                         
router.get("/delete-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  staffHelper.deleteworkspace(workspaceId).then((response) => {
    fs.unlinkSync("./public/images/workspace-images/" + workspaceId + ".png");
    res.redirect("/staff/all-workspaces");
  });
});

///////DELETE ALL workspace/////////////////////                                         
router.get("/delete-all-workspaces", verifySignedIn, function (req, res) {
  staffHelper.deleteAllworkspaces().then(() => {
    res.redirect("/staff/all-workspaces");
  });
});


router.get("/all-users", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.getAllUsers().then((users) => {
    res.render("staff/all-users", { staff: true, layout: "admin", users, staff });
  });
});

router.get("/pending-approval", function (req, res) {
  if (!req.session.signedInStaff || req.session.staff.approved) {
    res.redirect("/staff");
  } else {
    res.render("staff/pending-approval", {
      staff: true, layout: "empty",
    });
  }
});


router.get("/signup", function (req, res) {
  if (req.session.signedInStaff) {
    res.redirect("/staff");
  } else {
    res.render("staff/signup", {
      staff: true, layout: "empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", async function (req, res) {
  const { Staffname, Email, Phone, Address, District, State, Pincode, Password, Repassword } = req.body;
  let errors = {};

  // Field validations
  if (!Staffname) errors.staffname = "Please enter your name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Phone) errors.phone = "Please enter your phone number.";
  if (!Address) errors.address = "Please enter your address.";
  if (!District) errors.district = "Please enter your district.";
  if (!State) errors.state = "Please enter a state.";
  if (!Pincode) errors.pincode = "Please enter your pincode.";
  if (!Password) errors.password = "Please enter a password.";
  if (!Repassword) errors.repassword = "Please enter Re-password.";

  // Check if email or company name already exists
  const existingEmail = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Email });
  if (existingEmail) errors.email = "This email is already registered.";

  const existingStaffname = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Staffname });
  if (existingStaffname) errors.Staffname = "This company name is already registered.";

  // Validate Pincode and Phone
  if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
  const existingPhone = await db.get()
    .collection(collections.STAFF_COLLECTION)
    .findOne({ Phone });
  if (existingPhone) errors.phone = "This phone number is already registered.";

  // If there are validation errors, re-render the form
  if (Object.keys(errors).length > 0) {
    return res.render("staff/signup", {
      staff: true,
      layout: 'empty',
      errors,
      Staffname,
      Email,
      Phone,
      Address,
      District,
      Pincode,
      Password,
      Repassword,
      State
    });
  }

  // Call signup helper
  staffHelper.dosignup(req.body).then((response) => {
    if (!response) {
      req.session.signUpErr = "Invalid Admin Code";
      return res.redirect("/staff/signup");
    }

    // Proceed with signup process
    req.session.signedInStaff = true;
    req.session.staff = response;
    res.redirect("/staff/pending-approval");

  }).catch((err) => {
    console.log("Error during signup:", err);
    res.status(500).send("Error during signup");
  });
});



router.get("/signin", function (req, res) {
  if (req.session.signedInStaff) {
    res.redirect("/staff");
  } else {
    res.render("staff/signin", {
      staff: true, layout: "empty",
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  // Validate Email and Password
  if (!Email || !Password) {
    req.session.signInErr = "Please fill all fields.";
    return res.redirect("/staff/signin");
  }

  staffHelper.doSignin(req.body)
    .then((response) => {
      if (response.status === true) {
        req.session.signedInStaff = true;
        req.session.staff = response.staff;
        res.redirect("/staff");
      } else if (response.status === "pending") {
        req.session.signInErr = "This user is not approved by admin, please wait.";
        res.redirect("/staff/signin");
      } else if (response.status === "rejected") {
        req.session.signInErr = "This user is rejected by admin.";
        res.redirect("/staff/signin");
      } else {
        req.session.signInErr = "Invalid Email/Password";
        res.redirect("/staff/signin");
      }
    })
    .catch((error) => {
      console.error(error);
      req.session.signInErr = "An error occurred. Please try again.";
      res.redirect("/staff/signin");
    });
});




router.get("/signout", function (req, res) {
  req.session.signedInStaff = false;
  req.session.staff = null;
  res.redirect("/staff");
});

router.get("/add-product", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  res.render("staff/add-product", { staff: true, layout: "admin", workspace });
});

router.post("/add-product", function (req, res) {
  staffHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/product-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/staff/add-product");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let productId = req.params.id;
  let product = await staffHelper.getProductDetails(productId);
  console.log(product);
  res.render("staff/edit-product", { staff: true, layout: "admin", product, workspace });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  staffHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/staff/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  staffHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/staff/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  staffHelper.deleteAllProducts().then(() => {
    res.redirect("/staff/all-products");
  });
});

router.get("/all-users", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.getAllUsers().then((users) => {
    res.render("staff/users/all-users", { staff: true, layout: "admin", workspace, users });
  });
});

router.get("/remove-user/:id", verifySignedIn, function (req, res) {
  let userId = req.params.id;
  staffHelper.removeUser(userId).then(() => {
    res.redirect("/staff/all-users");
  });
});

router.get("/remove-all-users", verifySignedIn, function (req, res) {
  staffHelper.removeAllUsers().then(() => {
    res.redirect("/staff/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let staff = req.session.staff;
  let orders = await staffHelper.getAllOrders();
  res.render("staff/all-orders", {
    staff: true, layout: "admin",
    workspace,
    orders,
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let staff = req.session.staff;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("staff/order-products", {
      staff: true, layout: "admin",
      workspace,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  staffHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  staffHelper.cancelOrder(orderId).then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  staffHelper.cancelAllOrders().then(() => {
    res.redirect("/staff/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let staff = req.session.staff;
  staffHelper.searchProduct(req.body).then((response) => {
    res.render("staff/search-result", { staff: true, layout: "admin", workspace, response });
  });
});


module.exports = router;
