const supabase = require("../supabase");

class AuthModel {
  async findUserByEmail(email) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (error) {
      return { user: null, error: checkError };
    }

    return { user: users && users.length > 0 ? users[0] : null, error: null };
  }

  async createUser(email, password) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({ email: email, password_hash: password_hash })
      .select("id")
      .single();

    if (error) return { user: null, error };

    return { user: userData, error: null };
  }

  async createProfile(user_id, name) {
    const { error } = await supabase
      .from("profiles")
      .insert({ user_id: user_id, name: name });

    if (error) return { success: false, error };

    return { success: true, error: null };
  }

  async findUserWithPasswordByEmail(email) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email)
      .limit(1);

    if (error) return { user: null, error };

    return { user: users && users.length > 0 ? users[0] : null, error: null };
  }

  async getProfileByUserId(user_id) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (error) return { profile: null, error };

    return { profile: data, error: null };
  }
}

module.exports = AuthModel;
