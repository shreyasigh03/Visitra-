import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Notice from "./Notice";
import { apiFetch } from "../lib/api";
import { getOrg, saveOrg } from "../lib/org";

const Organizations = () => {
  const [orgs, setOrgs] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const current = getOrg().code;

  useEffect(() => {
    apiFetch("/api/org/list").then(setOrgs, (err) => setError(err.message));
  }, []);

  const choose = (org) => {
    saveOrg(org);
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <h1 className="font-display mb-2 text-center text-[26px] font-extrabold tracking-tight sm:text-[34px]">Choose your organization</h1>
        <p className="mb-8 text-center text-[15px] text-[var(--muted)]">Each one has its own admin, teachers, guards and visitor records.</p>
        {error && <Notice type="error" className="mb-5">{error}</Notice>}
        {!orgs && !error && <Notice className="text-center">Loading…</Notice>}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs?.map((org) => (
            <li key={org.code}>
              <button
                type="button"
                disabled={!org.active}
                onClick={() => choose(org)}
                className={`clay-sm h-full w-full rounded-[26px] p-6 text-left ${org.active ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                style={org.active && org.code === current ? { outline: "3px solid var(--accent)" } : undefined}
              >
                <span className="font-display block text-2xl font-extrabold">{org.code}</span>
                <span className="block font-semibold">{org.name}</span>
                <span className="mt-2 block text-[13px] capitalize text-[var(--muted)]">
                  {org.type}{!org.active ? " · Coming soon" : org.code === current ? " · Selected" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default Organizations;
