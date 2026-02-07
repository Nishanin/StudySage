const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const supabase = require("../supabase");

const SALT_ROUNDS = 10;

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        code: "VALIDATION_ERROR",
        message: "Missing : name / email / password",
      });
    }

    const { data: users, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (checkError) {
      return res.status(400).json({
        status: "fail",
        code: "DATABASE_ERROR",
        message: "Database error",
      });
    }

    if (users && users.length > 0) {
      return res.status(409).json({
        status: "fail",
        code: "AUTH_USER_EXISTS",
        message: "User already exist. Try to Login",
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    if (process.env.NODE_ENV == "development")
      console.log(`Hashed password of ${password} => ${password_hash}`);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({ email: email, password_hash: password_hash })
      .select("id")
      .single();

    if (userError) {
      return res.status(400).json({
        status: "fail",
        code: "USER_CREATION_FAILED",
        message: "Unable to register user",
      });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ user_id: userData.id, name: name });

    if (profileError) {
      return res.status(400).json({
        status: "fail",
        code: "PROFILE_CREATION_FAILED",
        message: "Unable to create user profile",
      });
    }

    const token = jwt.sign(
      { userId: userData.id, email: email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        code: "VALIDATION_ERROR",
        message: "Missing : email / password",
      });
    }

    const { data: users, error: loginError } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email)
      .limit(1);

    if (loginError) {
      return res.status(400).json({
        status: "fail",
        code: "DATABASE_ERROR",
        message: "Database error",
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        status: "fail",
        code: "AUTH_INVALID_CREDENTIALS",
        message: "User does not exist. Try to Register",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const me = async (req, res) => {
  try {
    const { userId } = req.user;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return res.status(400).json({
        status: "fail",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
