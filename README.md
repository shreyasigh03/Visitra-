# VISITRA

Visitor management with email OTP, face-verified entry, and an admin dashboard.

**Live website: https://visitra-vms.vercel.app**

| Part | Folder | Address |
| --- | --- | --- |
| Website (React + Vite) | `src/` | http://localhost:5173 |
| Backend (Express + MongoDB Atlas) | `backend/` | http://localhost:5001 |
| Face service (FastAPI + InsightFace) | `ai-service/` | http://localhost:8000 |

## Start everything

```bash
npm run dev:all
```

Then open http://localhost:5173. The face service needs about 30 seconds the first time.
Press `Ctrl+C` to stop all three.

Always start the face service this way. It uses `ai-service/.venv`, which has the face
libraries; plain `python3` usually does not.

## First-time setup

```bash
npm install
npm install --prefix backend
cp backend/.env.example backend/.env   # then fill it in
```

### Backend .env

| Setting | Meaning |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail address and its 16-character App Password |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin dashboard login. Change them here, then restart the backend |
| `JWT_SECRET` | Long random string that signs admin logins |
| `AI_SERVICE_URL` | Face service address, normally `http://127.0.0.1:8000` |

Never commit `backend/.env`. Each teammate needs their own copy.

### Face service

Needs Python 3.11:

```bash
cd ai-service
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python download_models.py
```

### Old-data clean-up

The admin's **Old records** page shows what is due and has a search for past visitors.
Cleaning up does two things:

- deletes the face photo and face data `FACE_RETENTION_MONTHS` (3) after the visit
- moves the record to `visitra-visitors-YEAR.xlsx` after `RECORD_RETENTION_MONTHS` (12).
  It reads the file back first, and deletes from the database only if every row is there

Nothing is deleted until someone presses the button on that page, or `AUTO_CLEANUP=true`
is set. Set `ARCHIVE_DIR` to a Google Drive folder to keep the files online. Restart the
backend after changing `.env`. Do not rename the columns or edit rows in these files.

## If something goes wrong

Open http://localhost:5001/api/health. It shows which part is down.

| What you see | Fix |
| --- | --- |
| Could not reach the VISITRA server | Run `npm run dev:all` |
| The database is not connected | In Atlas, go to Network Access, then Add IP Address, then Add current IP. A new Wi-Fi usually means a new IP |
| Face recognition service is off | Wait 30 seconds. If it stays, read the `[face]` lines in the terminal |
| Port is already in use (`npm run demo`) | Close the other terminal that is running VISITRA |
| OTP email failed | Check `EMAIL_USER` and `EMAIL_PASS` |

## Online

| Part | Where | Vercel project |
| --- | --- | --- |
| Website | https://visitra-vms.vercel.app | `visitra-vms` (folder `.`) |
| Backend | https://visitra.vercel.app | `visitra` (folder `backend`) |
| Face service | https://ai-service-two-virid.vercel.app | `ai-service` (folder `ai-service`) |

All three update themselves when `main` changes. Everything works online
except two jobs, which need the laptop: reading teachers' email answers, and the clean-up with the
Excel file.

- The website finds the backend through `VITE_API_URL` in `.env.production`.
- The backend's settings are in Vercel -> `visitra` -> Settings -> Environment Variables:
  `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `WEB_URL`. Redeploy after a change.
  `AI_SERVICE_URL` and `AI_SERVICE_KEY` too; the key must be the same in Vercel -> `ai-service`.
- Online, photos are kept in the database, and `ai-service/download_models.py` gets the face models.
- MongoDB Atlas -> Network Access must allow `0.0.0.0/0`, because Vercel has no fixed IP address.
- Use a strong `ADMIN_PASSWORD`: anyone can open the online login page.

## Checks

```bash
npm run lint
npm run build
```

## Teacher approval

1. The admin adds a teacher on the **Teachers** page. The teacher gets an email with a link
   to choose a password, and then stays signed in for 30 days.
2. A visitor picks the teacher and confirms the OTP. The teacher gets an email, plus a
   notification on each device where they pressed **Turn on notifications**.
3. The teacher approves, rejects or reschedules on `/TeacherDashboard`. The visitor gets an email.

**From any phone, without a public website:** the email has Approve, Reject and Reschedule
buttons. Each one prepares a reply with a secret code, and the teacher presses Send. The
backend reads the subject lines of new mail in `EMAIL_USER` (read-only) every few seconds
and applies the answer. Treat the request email as private: forwarding it lets others answer.

Email links use `WEB_URL`. While it is `http://localhost:5173` they open only on this
computer. Phones need a public `https` address, and `VITE_API_URL` must point to a public backend.

## Show it on phones (temporary)

```bash
npm run demo
```

Run this instead of `npm run dev:all`. It needs the free tool `cloudflared` and an admin
password of 10 or more characters. It prints a public link that opens VISITRA on any phone
while this window stays open. Teacher emails use that link automatically.

The link changes every time, and phones treat each new link as a new website, so teachers
must sign in and turn on notifications again. Anyone with the link can open VISITRA.

## Gate and guards

The admin adds guards on the **Guards** page (username and password, no email). A guard signs
in at `/GuardLogin` and works on `/Gate`: scan the pass QR code with any camera, choose a
picture of it, or type the Pass ID, then press **Let in** or **Record exit**. A pass works
only on its visit date. Blacklisted people get a red alert.

## Organizations

Every record belongs to one organization, and `backend/services/tenant.js` adds it to every
database query. **SRMUH** (SRM University Haryana) is active; its admin is in `backend/.env`.
The others are listed as "Coming soon".

The owners of VISITRA sign in at `/SuperLogin` once `SUPER_ADMIN_EMAIL` and a
`SUPER_ADMIN_PASSWORD` of 10 or more characters are set. They add organizations, set each
one's admin and turn it on. They see numbers only, not visitors.
