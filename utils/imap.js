// Minimal read-only IMAP client: just enough to see the subjects of new emails.
const tls = require("tls");

const TIMEOUT_MS = 20_000;
const MAX_BUFFER = 2 * 1024 * 1024;

const quote = (text) => `"${text.replace(/[\\"]/g, "\\$&")}"`;

class ImapClient {
  constructor({ host, port, user, password }) {
    Object.assign(this, { host, port, user, password });
    this.buffer = "";
    this.tagNumber = 0;
  }

  async connect() {
    this.socket = tls.connect({ host: this.host, port: this.port, servername: this.host });
    this.socket.setEncoding("latin1"); // one character per byte, so literal sizes match
    this.socket.setTimeout(TIMEOUT_MS * 3, () => this.socket.destroy(new Error("IMAP connection timed out")));
    this.socket.on("data", (chunk) => {
      this.buffer += chunk;
      if (this.buffer.length > MAX_BUFFER) this.socket.destroy(new Error("IMAP reply too large"));
      this.wake?.();
    });
    this.socket.on("error", (err) => this.fail(err));
    this.socket.on("close", () => this.fail(new Error("IMAP connection closed")));
    await this.readLine(); // greeting
    await this.command(`LOGIN ${quote(this.user)} ${quote(this.password)}`);
  }

  fail(err) {
    this.error ??= err;
    this.wake?.();
  }

  close() {
    this.socket?.destroy();
  }

  async take(getLength) {
    const deadline = Date.now() + TIMEOUT_MS;
    for (;;) {
      const length = getLength();
      if (length >= 0) {
        const text = this.buffer.slice(0, length);
        this.buffer = this.buffer.slice(length);
        return text;
      }
      if (this.error) throw this.error;
      const left = deadline - Date.now();
      if (left <= 0) throw new Error("IMAP reply timed out");
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, left);
        this.wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }
  }

  async readLine() {
    const line = await this.take(() => {
      const end = this.buffer.indexOf("\r\n");
      return end < 0 ? -1 : end + 2;
    });
    return line.slice(0, -2);
  }

  // Returns [{ line, literals }] for every untagged reply.
  async command(text) {
    const tag = `V${++this.tagNumber}`;
    this.socket.write(`${tag} ${text}\r\n`);
    const replies = [];
    for (;;) {
      let line = await this.readLine();
      const literals = [];
      let size;
      while ((size = /\{(\d+)\}$/.exec(line))) {
        const length = Number(size[1]);
        literals.push(await this.take(() => (this.buffer.length >= length ? length : -1)));
        line = `${line.slice(0, size.index)}${await this.readLine()}`;
      }
      if (line.startsWith(`${tag} `)) {
        if (line.startsWith(`${tag} OK`)) return replies;
        throw new Error(`IMAP ${text.split(" ")[0]} refused`); // never include the text: it may hold the password
      }
      replies.push({ line, literals });
    }
  }

  // EXAMINE opens the mailbox read-only.
  async examine(mailbox) {
    const text = (await this.command(`EXAMINE ${quote(mailbox)}`)).map((r) => r.line).join("\n");
    return { uidValidity: Number(/UIDVALIDITY (\d+)/.exec(text)?.[1]), uidNext: Number(/UIDNEXT (\d+)/.exec(text)?.[1]) };
  }

  async subjectsFrom(uid) {
    const replies = await this.command(`UID FETCH ${uid}:* (BODY.PEEK[HEADER.FIELDS (SUBJECT)])`);
    return replies
      .filter((r) => / FETCH /.test(r.line) && r.literals.length)
      .map((r) => ({
        uid: Number(/UID (\d+)/.exec(r.line)?.[1]),
        subject: r.literals[0].replace(/\r\n[ \t]+/g, " ").replace(/^subject:\s*/i, "").trim(),
      }))
      .filter((m) => m.uid >= uid) // "n:*" always returns the last message too
      .sort((a, b) => a.uid - b.uid);
  }
}

module.exports = ImapClient;
