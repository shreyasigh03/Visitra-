import { useEffect, useRef, useState } from "react";

// How many table rows fit in a box, so that the page does not have to scroll.
// `isOn` is a media query; elsewhere the normal number is used.
export function useFitRows({ rowHeight, headHeight, normal, isOn }) {
  const ref = useRef(null);
  const [rows, setRows] = useState(normal);

  useEffect(() => {
    const query = matchMedia(isOn);
    const measure = () =>
      setRows(query.matches ? Math.max(3, Math.floor((ref.current.clientHeight - headHeight) / rowHeight)) : normal);
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    query.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", measure);
    };
  }, [rowHeight, headHeight, normal, isOn]);

  return [ref, rows];
}
