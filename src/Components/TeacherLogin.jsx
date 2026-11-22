import LoginForm from "./LoginForm";

const TeacherLogin = () => (
  <LoginForm
    role="teacher"
    home="/TeacherDashboard"
    title="Teacher sign in"
    intro="See who wants to meet you, and approve, reject or reschedule."
    footer="New here, or forgot your password? Ask the admin to email you a link."
  />
);

export default TeacherLogin;
