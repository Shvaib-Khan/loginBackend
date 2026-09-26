import LoginAttempt from "../models/loginAttempt.model.js";

const recordLoginAttempt = async (email, ipAddress, status, reason) => {
  await LoginAttempt.create({ email, ip_address: ipAddress, status, reason }).catch(() => {});
};

export { recordLoginAttempt };
