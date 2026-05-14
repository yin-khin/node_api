const IsValid = (value) => {
  if (value == null || value === undefined || value === "") {
    return false; // Invalid if empty/null/undefined
  }
  return true; // Valid otherwise
};

module.exports = IsValid;
