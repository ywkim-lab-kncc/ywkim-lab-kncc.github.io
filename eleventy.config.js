// Eleventy configuration.
// You normally never need to edit this file — lab content lives in src/_data/*.yml.
import yaml from "js-yaml";

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default function (eleventyConfig) {
  // Read *.yml / *.yaml data files
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));

  // Copy static files as-is
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // ---- Filters -----------------------------------------------------------

  // Bold every author whose citation name matches a lab member's `pub_names`.
  // Markers like * (equal contribution) and † (corresponding) are kept but ignored when matching.
  eleventyConfig.addFilter("authorList", (authors, labNames, maxAuthors = 15) => {
    if (!Array.isArray(authors)) return "";
    const names = new Set((labNames || []).map((n) => n.trim().toLowerCase()));
    const clean = (a) => a.replace(/[*†#‡]/g, "").trim().toLowerCase();
    let list = authors;
    let truncated = false;
    if (authors.length > maxAuthors) {
      // keep first authors + any lab members further down
      const head = authors.slice(0, maxAuthors - 3);
      const labLater = authors.slice(maxAuthors - 3).filter((a) => names.has(clean(a)));
      list = [...head, ...labLater];
      truncated = true;
    }
    const html = list
      .map((a) => (names.has(clean(a)) ? `<strong>${escapeHtml(a)}</strong>` : escapeHtml(a)))
      .join(", ");
    return truncated ? `${html}, et al.` : html;
  });

  // All citation names of current members, alumni and the PI
  eleventyConfig.addFilter("labNames", (members, pi) => {
    const out = [...(pi?.pub_names || [])];
    for (const m of members || []) out.push(...(m.pub_names || []));
    return out;
  });

  eleventyConfig.addFilter("byStatus", (members, status) =>
    (members || []).filter((m) => (m.status || "current") === status));

  // Group members by the `group` of their role (roles.yml), keeping the role order,
  // e.g. "Researchers" = postdocs first, then other researchers.
  eleventyConfig.addFilter("groupMembers", (members, roles) => {
    const groups = new Map();
    (roles || []).forEach((r) => { if (!groups.has(r.group)) groups.set(r.group, []); });
    (roles || []).forEach((r) => {
      (members || [])
        .filter((m) => m.role === r.key)
        .forEach((m) => groups.get(r.group).push({ ...m, roleInfo: r }));
    });
    return [...groups.entries()].filter(([, items]) => items.length).map(([label, items]) => ({ label, items }));
  });

  // Group publications by year, newest first
  eleventyConfig.addFilter("groupByYear", (pubs) => {
    const groups = new Map();
    [...(pubs || [])]
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .forEach((p) => {
        const y = p.year || "In press";
        if (!groups.has(y)) groups.set(y, []);
        groups.get(y).push(p);
      });
    return [...groups.entries()].map(([year, items]) => ({ year, items }));
  });


  eleventyConfig.addFilter("formatDate", (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  });

  eleventyConfig.addFilter("initials", (name) =>
    String(name || "")
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join(""));

  eleventyConfig.addFilter("searchText", (p) =>
    [p.title, (p.authors || []).join(" "), p.journal, p.year, p.pmid, p.doi].join(" ").toLowerCase());

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
  };
}
