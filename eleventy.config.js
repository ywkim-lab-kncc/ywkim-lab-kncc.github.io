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

  // Bold lab members in author lists.
  // A member's name is bolded only in papers from the year they joined the lab onward
  // (so a common name like "Kim H" is not bolded in older, unrelated papers).
  // A paper can also list names to never bold with `unbold: ["Kim H"]`.
  // Markers like * (equal contribution) and † (corresponding) are kept but ignored when matching.
  // Shared rule: is author `a` a lab member for a paper published in `year`?
  // A member counts from the year they joined; the PI always counts; `unbold` names never count.
  const cleanName = (a) => String(a).replace(/[*†#‡]/g, "").trim().toLowerCase();
  function labMatcher(labNames, year, unbold) {
    const since = new Map();                    // citation name → first year it counts (null = always)
    const full = new Map();                     // citation name → full names (for search)
    for (const { name, from, fullName } of labNames || []) {
      const k = cleanName(name);
      if (!since.has(k) || from === null || (since.get(k) !== null && from < since.get(k))) since.set(k, from);
      if (fullName) full.set(k, [...(full.get(k) || []), { fullName, from }]);
    }
    const skip = new Set((unbold || []).map(cleanName));
    const y = Number(year);
    const counts = (from) => from === null || !y || y >= from;
    return {
      isLab: (a) => {
        const k = cleanName(a);
        return since.has(k) && !skip.has(k) && counts(since.get(k));
      },
      fullNames: (a) => {
        const k = cleanName(a);
        if (skip.has(k)) return [];
        const list = full.get(k) || [];
        // If the PI shares this citation name (e.g. "Kim Y"), only the PI is meant —
        // otherwise a search for another member would also find all of the PI's papers.
        const pi = list.filter((f) => f.from === null);
        return (pi.length ? pi : list.filter((f) => counts(f.from))).map((f) => f.fullName);
      },
    };
  }

  eleventyConfig.addFilter("authorList", (authors, labNames, year, unbold, maxAuthors = 15) => {
    if (!Array.isArray(authors)) return "";
    const { isLab } = labMatcher(labNames, year, unbold);
    let list = authors;
    let truncated = false;
    if (authors.length > maxAuthors) {
      // keep first authors + any lab members further down
      const head = authors.slice(0, maxAuthors - 3);
      const labLater = authors.slice(maxAuthors - 3).filter(isLab);
      list = [...head, ...labLater];
      truncated = true;
    }
    const html = list
      .map((a) => (isLab(a) ? `<strong>${escapeHtml(a)}</strong>` : escapeHtml(a)))
      .join(", ");
    return truncated ? `${html}, et al.` : html;
  });

  // Citation names of the PI (always) and of members/alumni (from the year they joined)
  eleventyConfig.addFilter("labNames", (members, pi) => {
    const out = (pi?.pub_names || []).map((name) => ({ name, from: null, fullName: pi.name }));
    for (const m of members || [])
      for (const name of m.pub_names || [])
        out.push({ name, from: m.joined ? Number(m.joined) : null, fullName: m.name });
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

  // Initials shown when there is no photo: first letter of the first and last name.
  // "Hyung-Min Ahn" → "HA", "Youngwook Kim, Ph.D." → "YK" (anything after a comma is ignored)
  eleventyConfig.addFilter("initials", (name) => {
    const words = String(name || "").split(",")[0].trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  });

  // Text the Publications search looks through. Lab members are also findable by
  // their full name (e.g. "hyondeog"), not only by the citation form ("Kim H").
  eleventyConfig.addFilter("searchText", (p, labNames) => {
    const { fullNames } = labMatcher(labNames, p.year, p.unbold);
    const members = (p.authors || []).flatMap(fullNames);
    return [p.title, (p.authors || []).join(" "), members.join(" "), p.journal, p.year, p.pmid, p.doi]
      .join(" ").toLowerCase();
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
  };
}
