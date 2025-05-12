const SoldToken = require("../models/SoldToken");
const User = require("../models/User");
const Contract = require("../models/Contract");
const AuthToken = require("../models/AuthToken");
const keyService = require("../services/keyService");
const ArchivedUser = require("../models/ArchivedUser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// $ is registred before
exports.isRegistredBefore = async (req, res) => {
  try {
    const { deviceId, hDeviceId } = req.params;
    console.log(deviceId, hDeviceId);
    const isValid = verifyDeviceId(deviceId, hDeviceId);
    console.log("isValid: ", isValid);
    if (!isValid) {
      res.json({ status: "ACCESS DENIED" });
    } else {
      const authToken = jwt.sign({ deviceId }, process.env.SECRET_KEY, {
        expiresIn: "7d",
      });

      let existingUser = await User.findOne({ deviceId }); // payload in deviceId
      if (!existingUser) {
        res.json({ status: "DELETED", authToken });
      } else {
        res.json({ status: "REGISTERED", authToken, userInfo: `${existingUser.firstName}#${existingUser.lastName}#${
        keyService.formatDate(existingUser.birthDate) || ""
      }#${existingUser.placeOfBirth}#${existingUser.email}#${existingUser.phone}#${existingUser.school}#${
        existingUser.address
      }#${existingUser.userType}` });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// $ register new user
exports.registerNewUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { deviceId, soldToken } = req.body;
    
    const sldToken = soldToken.toUpperCase();

    // Validate the sold token within the transaction
    const isValid = await keyService.validateKey(sldToken);
    
    if (isValid.consumed || !isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: "INVALID SOLD TOKEN" });
    }

    // Check for existing contract
    const existingContract = await Contract.findOne({ soldToken: sldToken }).session(session);
    if (existingContract) {
      if (deviceId !== existingContract.deviceId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: "ALREADY HAVE AN ACCOUNT" });
      }
      if (new Date() > existingContract.expiringDate) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: "EXPIRED CONTRACT" });
      }
    }

    const type = sldToken.length === 10 ? 1 : sldToken.length === 8 ? 2 : 1;
    const existingUser = await User.findOne({ deviceId }).session(session);

    if (!existingUser) {
      // Create new user and contract in a single transaction
      const [newUser, newContract] = await Promise.all([
        User.create([{
          deviceId,
          firstName: "first name",
          lastName: "last name",
          birthDate: "01/01/2005 15:30:05",
          placeOfBirth: "Alger",
          email: "example",
          phone: "0500000000",
          school: "school",
          address: "البلدية",
          userType: type,
        }], { session }),
        
        Contract.create([{
          deviceId,
          soldToken: sldToken,
          startDate: new Date(),
          expiringDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // one year
        }], { session })
      ]);

      // Update sold token status
      const updateResult = await SoldToken.updateOne(
        { key: sldToken },
        { $set: { consumed: true } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(`SoldToken ${sldToken} not found during update`);
      }

      await session.commitTransaction();
      session.endSession();
      
      console.log(`🆕 New user registered: ${deviceId}`);
      const user = newUser[0]
      return res.json({ status: "CREATED", userInfo: `${user.firstName}#${user.lastName}#${
        keyService.formatDate(user.birthDate) || ""
      }#${user.placeOfBirth}#${user.email}#${user.phone}#${user.school}#${
        user.address
      }#${user.userType}`});
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.json(existingUser);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// $ validate auth token
exports.validateAuthToken = async (req, res) => {
  try {
    console.log("Hello");
    const { deviceId, authToken } = req.body;

    if (!authToken)
      return res.status().json({ msg: "No auth token, access denied" });
    const verified = jwt.verify(authToken, process.env.SECRET_KEY);
    if (!verified) {
      res.status(401).json({ status: "NOT VALID" });
    }
    const user = await User.findOne({ deviceId });

    if (!user) {
      res.status(401).json({ status: "USER NOT FOUND" });
    }

    // Token is valid - return user info
    res.json({
      status: "VALID",
      userInfo: `${user.firstName}#${user.lastName}#${
        keyService.formatDate(user.birthDate) || ""
      }#${user.placeOfBirth}#${user.email}#${user.phone}#${user.school}#${
        user.address
      }#${user.userType}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// $ send new auth token
exports.sendNewAuthToken = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    const user = User.findOne({ deviceId });
    if (!user) {
      console.log(`❌ User not found: ${deviceId}`);
      return { code: 404 };
    }
    const authToken = jwt.sign({ deviceId }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
    res.json({ authToken, ...user._doc });
  } catch (err) {
    console.error("❌ Token Generation Error:", err);
    return { code: 500 };
  }
};

// $ save user information
exports.saveUserInformation = async (req, res) => {
  try {
    const { deviceId, userInfo } = req.body;
    console.log(deviceId, userInfo, "from controller");
    const [
      firstName,
      lastName,
      birthDate,
      placeOfBirth,
      email,
      phone,
      school,
      commune,
    ] = userInfo.split("#");

    let existingUser = await User.findOne({ deviceId });
    if (!existingUser) {
      res.status(500).json({ error: "user not found" });
    }

    // Update user information
    existingUser.firstName = firstName || existingUser.firstName;
    existingUser.lastName = lastName || existingUser.lastName;
    existingUser.birthDate = birthDate || existingUser.birthDate;
    existingUser.placeOfBirth = placeOfBirth || existingUser.placeOfBirth;
    existingUser.email = email || existingUser.email;
    existingUser.phone = phone || existingUser.phone;
    existingUser.school = school || existingUser.school;
    existingUser.address = commune || existingUser.commune;

    // Save the updated user
    const updatedUser = await existingUser.save();
    console.log("updated user userType:", updatedUser.userType);

    res.json({
      status: "SAVED",
      userInfo: `${updatedUser.firstName}#${updatedUser.lastName}#${
        keyService.formatDate(updatedUser.birthDate) || ""
      }#${updatedUser.placeOfBirth}#${updatedUser.email}#${updatedUser.phone}#${
        updatedUser.school
      }#${updatedUser.address}#${updatedUser.userType}`,
    });
  } catch (err) {
    res.status(500).json({ error: "update error" });
  }
};

// $ delete account
exports.deleteAccount = async (req, res) => {
  try {
    const [deviceId, authToken] = payload.split("#");
    const user = await User.findOne({ deviceId });
    if (!user) {
      res.status(500).json({ error: "user not found" });
      return {
        responseCode: REQUEST_RESPONSE.USER_NOT_FOUND,
      };
    }

    // Convert to plain object and remove _id to avoid duplicate key error
    const userData = user.toObject();
    delete userData._id;

    // Create archived user
    const archivedUser = new ArchivedUser({
      ...userData,
    });

    await archivedUser.save();
    await User.deleteOne({ deviceId });

    res.json({ message: "user deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "please try again later" });
  }
};

// $ restore account
exports.restoreAccount = async (req, res) => {
  try {
    const [deviceId, authToken] = payload.split("#");
    const archivedUser = await ArchivedUser.findOne({ deviceId });
    if (!archivedUser) {
      res.status(500).json({ error: "user not found" });
    }

    // Check if account has been archived for more than 30 days
    const archiveDate = archivedUser.archivedAt;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (archiveDate < thirtyDaysAgo) {
      res
        .status(500)
        .json({ error: "Account cannot be restored after 30 days" });
    }

    // Convert to plain object and remove archivedAt
    const archivedUserData = archivedUser.toObject();
    delete archivedUserData._id;
    delete archivedUserData.archivedAt;

    // Create user
    const user = new User({
      ...archivedUserData,
    });

    // save user and delete archivedUser document
    await user.save();
    await ArchivedUser.deleteOne({ deviceId });

    res.json({ message: "user restored" });
  } catch (error) {
    res.status(500).json({ error: "error restoring user" });
    return { success: false, error: error.message };
  }
};

function verifyDeviceId(originalId, hashedId) {
  // Create SHA-256 hash of the original ID
  const hash = crypto.createHash("sha256");
  hash.update(originalId);
  const calculatedHash = hash.digest("hex");

  // Compare with the provided hashed ID
  return calculatedHash === hashedId;
}
