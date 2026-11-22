import LoginForm from "./LoginForm";

const SuperLogin = () => (
  <LoginForm
    role="super"
    home="/SuperAdmin"
    title="Super admin sign in"
    intro="Manage the organizations that use VISITRA."
    footer="Only for the owners of VISITRA."
  />
);

export default SuperLogin;
