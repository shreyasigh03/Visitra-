import { useState } from "react";

const LogoutButton = ({ onLogout }) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button type="button" className="btn-danger px-3.5 py-2 text-left text-[13px]" onClick={() => setConfirming((c) => !c)}>
        Logout
      </button>

      {confirming && (
        <div className="clay absolute right-2 top-full z-10 mt-2 w-64 rounded-[18px] p-4">
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">Are you sure you want to logout?</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirming(false)} className="btn-soft px-4 py-2 text-[13px]">No</button>
            {/* ProtectedRoute redirects to the login page. */}
            <button type="button" onClick={onLogout} className="btn-danger px-4 py-2 text-[13px]">Yes</button>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
