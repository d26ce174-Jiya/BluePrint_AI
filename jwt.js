import jwt from "jsonwebtoken";

const SECRET_KEY = "my_secret_key";

// Payload
const payload = {
    userId: 101,
    username: "Kush"
};

// Generate token
const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: "7d"
});

console.log("Generated JWT:", token);