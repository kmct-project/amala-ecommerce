var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {

  ///////ADD staff/////////////////////                                         
  addstaff: (staff, callback) => {
    console.log(staff);
    staff.Price = parseInt(staff.Price);
    db.get()
      .collection(collections.STAFF_COLLECTION)
      .insertOne(staff)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  ///////GET ALL staff/////////////////////                                            
  getAllstaffs: () => {
    return new Promise(async (resolve, reject) => {
      let staffs = await db
        .get()
        .collection(collections.STAFF_COLLECTION)
        .find()
        .toArray();
      resolve(staffs);
    });
  },

  ///////ADD staff DETAILS/////////////////////                                            
  getstaffDetails: (staffId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.STAFF_COLLECTION)
        .findOne({
          _id: objectId(staffId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE staff/////////////////////                                            
  deletestaff: (staffId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.STAFF_COLLECTION)
        .removeOne({
          _id: objectId(staffId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE staff/////////////////////                                            
  updatestaff: (staffId, staffDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.STAFF_COLLECTION)
        .updateOne(
          {
            _id: objectId(staffId)
          },
          {
            $set: {
              Name: staffDetails.Name,
              Category: staffDetails.Category,
              Price: staffDetails.Price,
              Description: staffDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL staff/////////////////////                                            
  deleteAllstaffs: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.STAFF_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },




  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    db.get()
      .collection(collections.PRODUCTS_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      if (adminData.Code == "admin123") {
        adminData.Password = await bcrypt.hash(adminData.Password, 10);
        db.get()
          .collection(collections.ADMIN_COLLECTION)
          .insertOne(adminData)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  doSignin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        bcrypt.compare(adminData.Password, admin.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login Failed");
        resolve({ status: false });
      }
    });
  },
  updateAdminPassword: (adminId, hashedPassword) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ADMIN_COLLECTION)
        .updateOne(
          { _id: objectId(adminId) },
          { $set: { Password: hashedPassword } }
        )
        .then((response) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getAdminDetails: (adminId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ _id: objectId(adminId) })
        .then((admin) => {
          resolve(admin);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllStaffs: () => {
    return new Promise(async (resolve, reject) => {
      let staffs = await db
        .get()
        .collection(collections.STAFF_COLLECTION)
        .find()
        .toArray();
      resolve(staffs);
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(orders);
    });
  },

  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },

  cancelAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },
};
