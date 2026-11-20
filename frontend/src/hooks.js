import { useEffect, useState } from "react";
import { api } from "./api";

export function useResource(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api(path, { signal: controller.signal }).then((result) => {
      setData(result);
      setError("");
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [path, revision]);

  return { data, error, reload: () => setRevision((current) => current + 1) };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function run(callback, success = "") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await callback();
      setNotice(success);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, notice };
}
