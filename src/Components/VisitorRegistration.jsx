import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdPerson } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import { FaPhoneFlip, FaUserGroup } from "react-icons/fa6";
import Navbar from "./Navbar";
import CameraCapture from "./CameraCapture";
import Notice from "./Notice";
import ServiceBanner from "./ServiceBanner";
import { apiFetch } from "../lib/api";
import { getOrg } from "../lib/org";
import { saveRegistration } from "../lib/registration";
import { REASONS, todayLocal } from "../lib/visitors";

const EMPTY = { name: "", email: "", phone: "", reason: "", otherReason: "", date: "", teacherId: "", toMeet: "" };
// Not in the list: the visitor types a name (the admin handles it) or a reason.
const OTHER = "other";
const RETRY_MS = 5000;
const MAX_GROUP = 50;

// Keeps 10 digits, so a pasted "+91 98765 43210" becomes 9876543210.
function phoneDigits(text) {
  const digits = text.replace(/\D/g, "");
  return digits.replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10);
}

const Field = ({ label, id, icon: Icon, children }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-[13px] font-bold tracking-wide text-[var(--muted)]" htmlFor={id}>
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]" />}
      {children}
    </div>
  </div>
);

const VisitorRegistration = () => {
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null); // { file, dataUrl }
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState(null); // null while loading
  const [times, setTimes] = useState(null); // { key, hasSlots, slots } of one teacher and day
  const [slotId, setSlotId] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [group, setGroup] = useState([""]);
  const [today] = useState(todayLocal);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    const load = () =>
      apiFetch("/api/teacher/list").then(setTeachers, () => {
        timer = setTimeout(load, RETRY_MS); // ServiceBanner explains what is down
      });
    load();
    return () => clearTimeout(timer);
  }, []);

  const typeHost = form.teacherId === OTHER;
  const typeReason = form.reason === OTHER;

  // Free times of the chosen teacher on the chosen day.
  const timesKey = form.teacherId && !typeHost && form.date ? `${form.teacherId} ${form.date}` : "";
  useEffect(() => {
    if (!timesKey) return undefined;
    let active = true;
    const [teacherId, date] = timesKey.split(" ");
    apiFetch(`/api/teacher/free?${new URLSearchParams({ teacherId, date })}`).then(
      (data) => active && setTimes({ key: timesKey, ...data }),
      (err) => active && setError(err.message),
    );
    return () => {
      active = false;
    };
  }, [timesKey]);
  const day = times?.key === timesKey ? times : null;
  const slot = day?.slots.find((x) => x.id === slotId);

  const bind = (key) => ({
    id: key,
    name: key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    required: true,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!photo) {
      setError("Please capture your photo before continuing.");
      return;
    }

    if (day?.hasSlots && !slot) {
      setError(day.slots.length ? "Please choose a time." : "No free time is left on this day. Please choose another date.");
      return;
    }

    const members = isGroup ? group.map((n) => n.trim()).filter(Boolean) : [];
    if (isGroup && members.length === 0) {
      setError("Please enter the name of at least one person coming with you.");
      return;
    }

    const { otherReason, ...fields } = form;
    const details = {
      ...fields,
      reason: typeReason ? otherReason.trim() : form.reason,
      teacherId: typeHost ? "" : form.teacherId,
      toMeet: typeHost ? form.toMeet : teachers.find((t) => t.id === form.teacherId).name,
    };
    const body = new FormData();
    Object.entries(details).forEach(([key, value]) => body.append(key, value));
    body.append("photo", photo.file);
    body.append("groupMembers", JSON.stringify(members));
    if (slot) body.append("slotId", slot.id);

    setSubmitting(true);
    setError("");
    try {
      const result = await apiFetch("/api/visitor/register", { method: "POST", body });
      saveRegistration({
        ...details,
        groupMembers: members,
        visitTime: result.visitTime,
        org: getOrg().name,
        visitorId: result.visitorId,
        passId: result.passId,
        resendAt: result.otpSent ? Date.now() + result.resendAfter * 1000 : 0,
        notice: { text: result.message, type: result.otpSent ? "success" : "error" },
      });
      navigate("/otp", { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      if (slot) {
        // Someone may have taken the time: show what is free now.
        const [teacherId, date] = timesKey.split(" ");
        apiFetch(`/api/teacher/free?${new URLSearchParams({ teacherId, date })}`).then(
          (data) => setTimes({ key: timesKey, ...data }),
          () => {},
        );
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:pt-10" style={{ animation: "fadeUp .5s ease both" }}>
        <div className="mb-8 text-center">
          <h1 className="font-display mb-2 text-[26px] font-extrabold tracking-tight sm:text-[34px]">Visitor registration</h1>
          <p className="text-[15px] text-[var(--muted)]">
            {getOrg().name}. Tell us who you are and who you're visiting — it takes under a minute.
          </p>
        </div>
        <ServiceBanner />

        <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr] lg:grid-rows-[auto_1fr]">
          <div className="clay min-w-0 rounded-[28px] p-5 sm:p-8">
            <div className="grid gap-4.5 sm:grid-cols-2">
              <Field label="Name" id="name" icon={IoMdPerson}>
                <input {...bind("name")} autoComplete="name" placeholder="Enter your name" className="input-clay w-full pr-10" />
              </Field>
              <Field label="Email" id="email" icon={MdEmail}>
                <input {...bind("email")} type="email" autoComplete="email" placeholder="Enter your email" className="input-clay w-full pr-10" />
              </Field>
              <Field label="Phone number" id="phone" icon={FaPhoneFlip}>
                <input
                  {...bind("phone")}
                  onChange={(e) => setForm((f) => ({ ...f, phone: phoneDigits(e.target.value) }))}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[0-9]{10}"
                  title="Exactly 10 digits, for example 9876543210"
                  placeholder="10-digit phone number"
                  className="input-clay w-full pr-10"
                />
              </Field>
              <Field label="Reason" id="reason">
                <select {...bind("reason")} className="input-clay w-full">
                  <option value="">Select reason</option>
                  {REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                  <option value={OTHER}>Other (write your own)</option>
                </select>
              </Field>
              {typeReason && (
                <Field label="Your reason" id="otherReason">
                  <input {...bind("otherReason")} maxLength={100} pattern=".*\S.*" title="Please write your reason" placeholder="Why are you visiting?" className="input-clay w-full" />
                </Field>
              )}
              <Field label="Date of visit" id="date">
                <input {...bind("date")} type="date" min={today} className="input-clay w-full" />
              </Field>
              <Field label="Who are you meeting?" id="teacherId">
                <select {...bind("teacherId")} className="input-clay w-full">
                  <option value="">{teachers ? "Select a name" : "Loading names…"}</option>
                  {teachers?.map((t) => (
                    <option key={t.id} value={t.id}>{t.department ? `${t.name} (${t.department})` : t.name}</option>
                  ))}
                  {teachers && <option value={OTHER}>Other (name not in the list)</option>}
                </select>
              </Field>
              {typeHost && (
                <Field label="Type their name" id="toMeet" icon={FaUserGroup}>
                  <input {...bind("toMeet")} placeholder="The admin will get this request" className="input-clay w-full pr-10" />
                </Field>
              )}
            </div>

            {day?.hasSlots && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-[13px] font-bold text-[var(--muted)]">Choose a free time</legend>
                {day.slots.length === 0 && <Notice type="warn">No free time is left on this day. Please choose another date.</Notice>}
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      aria-pressed={x.id === slotId}
                      onClick={() => setSlotId(x.id)}
                      className={`${x.id === slotId ? "btn-primary" : "btn-soft"} px-4 py-2.5 text-sm`}
                    >
                      {x.time}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="mt-5 flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--accent)]" />
              I am coming with other people (group visit)
            </label>
            {isGroup && (
              <div className="mt-3 grid gap-2.5">
                {group.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      aria-label={`Person ${i + 2}`}
                      maxLength={60}
                      placeholder={`Name of person ${i + 2}`}
                      value={name}
                      onChange={(e) => setGroup((g) => g.map((x, j) => (j === i ? e.target.value : x)))}
                      className="input-clay w-full min-w-0"
                    />
                    {group.length > 1 && (
                      <button type="button" aria-label={`Remove person ${i + 2}`} onClick={() => setGroup((g) => g.filter((_, j) => j !== i))} className="btn-soft w-12 shrink-0">✕</button>
                    )}
                  </div>
                ))}
                {group.length < MAX_GROUP && (
                  <button type="button" onClick={() => setGroup((g) => [...g, ""])} className="btn-soft py-2.5 text-sm">Add another person</button>
                )}
                <p className="text-[12.5px] text-[var(--muted)]">Only you need a photo and OTP. The whole group enters with your pass.</p>
              </div>
            )}
          </div>

          <div className="clay min-w-0 rounded-[28px] p-5 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="font-display text-[15px] font-bold">Profile photo</span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                REQUIRED
              </span>
            </div>

            <CameraCapture
              className="btn-soft"
              label={photo ? "Retake photo" : "Take my photo"}
              onCapture={(shot) => {
                setPhoto(shot);
                setError("");
              }}
            />
            {photo && (
              <div className="mt-4 flex items-center gap-3">
                <img src={photo.dataUrl} alt="Your captured photo" className="h-20 w-20 rounded-2xl object-cover" />
                <span className="text-[13px] font-semibold" style={{ color: "var(--ok-fg)" }}>Photo is good ✓</span>
              </div>
            )}

            <p className="mt-3.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Your photo is used for face-verified entry at the gate and stored with your visit record.
            </p>
          </div>
          <div className="clay min-w-0 rounded-[28px] p-5 sm:p-8">
            {error && <Notice type="error" className="mb-4">{error}</Notice>}
            <button disabled={submitting} className="btn-primary w-full py-3.5 text-[15px]">
              {submitting ? "Checking your photo…" : "Continue to OTP verification"}
            </button>
            <p className="mt-3.5 text-center text-[12.5px] text-[var(--muted)]">
              You'll receive a one-time password on your email to confirm your identity.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default VisitorRegistration;
