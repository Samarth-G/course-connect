import User from "../models/userModel.js";

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export async function findUserById(id) {
  return User.findById(id);
}

export async function createUser(userData) {
  return User.create(userData);
}
