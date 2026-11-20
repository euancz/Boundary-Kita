export default function RecordsFeedback({ resources = [], action }) {
  const error = action?.error || resources.find((resource) => resource.error)?.error;
  if (error) return <p className="operation-error" role="alert">{error}</p>;
  if (resources.some((resource) => resource.data === null)) {
    return <p role="status">Loading…</p>;
  }
  if (action?.notice) return <p className="operation-success" role="status">{action.notice}</p>;
  return null;
}
