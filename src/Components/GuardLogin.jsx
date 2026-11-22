import LoginForm from "./LoginForm";

const GuardLogin = () => (
  <LoginForm
    role="guard"
    api="gate"
    userKey="username"
    userLabel="Username"
    home="/Gate"
    title="Guard sign in"
    intro="Check passes and record who comes in and goes out."
    footer="Ask the admin if you need an account or a new password."
  />
);

export default GuardLogin;
