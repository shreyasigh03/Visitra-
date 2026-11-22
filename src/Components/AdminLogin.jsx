import LoginForm from "./LoginForm";

const AdminLogin = () => (
  <LoginForm
    role="admin"
    home="/Admindashboard"
    title="Admin sign in"
    intro="Access the VISITRA dashboard to manage visitors and approvals."
    footer="Restricted area — authorized security staff only."
  />
);

export default AdminLogin;
