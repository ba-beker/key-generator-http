const SoldToken = require("../models/SoldToken");

exports.validateKey = async (soldToken) => {
  const existingKey = await SoldToken.findOne({ key: soldToken });
  if (!existingKey) return false;

  return { consumed: existingKey.consumed };
};

exports.formatDate = (dateStr) => {
  // Create a Date object from the provided string
  const date = new Date(dateStr);

  // Extract the date components
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Return the formatted date string
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
