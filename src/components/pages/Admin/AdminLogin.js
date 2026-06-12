import LoginPortal from '../Auth/LoginPortal';

export default function AdminLogin({ language }) {
  return <LoginPortal language={language} portalRole="admin" />;
}
