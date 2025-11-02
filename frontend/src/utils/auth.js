export const saveAuth = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
