// Build-time values (footer year / "last updated" date). No need to edit.
export default function () {
  const now = new Date();
  return {
    year: now.getFullYear(),
    date: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }),
  };
}
