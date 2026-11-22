import { useEffect, useState } from "react";
import Notice from "./Notice";
import { getServiceWarning } from "../lib/api";

const CHECK_MS = 15_000;

// Says which service is down, and disappears once it is back.
const ServiceBanner = () => {
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const text = await getServiceWarning();
      if (active) setWarning(text);
    };
    check();
    const timer = setInterval(check, CHECK_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!warning) return null;
  return <Notice type="warn" className="mb-6">{warning}</Notice>;
};

export default ServiceBanner;
