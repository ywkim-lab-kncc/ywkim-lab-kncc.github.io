// Checks the lab data files before every build so that a typo produces a clear
// message instead of a broken page.   Run:  npm run check
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const DATA = "src/_data";
const PHOTOS = "src/assets/img/people";
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`✗ ${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`! ${file}: ${msg}`);

function load(name) {
  const file = path.join(DATA, name);
  try {
    return yaml.load(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.mark) {
      err(name, `YAML 문법 오류 (line ${e.mark.line + 1}, column ${e.mark.column + 1}): ${e.reason}\n    → 들여쓰기(스페이스 2칸), 따옴표, 콜론(:) 뒤 공백을 확인하세요.`);
    } else err(name, e.message);
    return null;
  }
}

const TRACKS = ["dry", "wet", "both"];
const STATUSES = ["current", "alumni"];

// ---- roles + members ----
const roles = load("roles.yml") || [];
const roleKeys = roles.map((r) => r.key);
roles.forEach((r, i) => {
  if (!r.key || !r.group) err("roles.yml", `#${i + 1}: key 와 group 이 모두 있어야 합니다.`);
});
const people = load("members.yml");
if (people) {
  if (!people.pi?.name) err("members.yml", "pi.name 이 비어 있습니다.");
  if (people.pi?.photo && !fs.existsSync(path.join(PHOTOS, people.pi.photo)))
    err("members.yml", `PI 사진 파일이 없습니다: ${PHOTOS}/${people.pi.photo}`);
  const gp = people.group_photo;
  if (gp?.file && !fs.existsSync(path.join(PHOTOS, gp.file)))
    err("members.yml", `단체 사진 파일이 없습니다: ${PHOTOS}/${gp.file} (파일명 대소문자도 확인)`);
  const seen = new Set();
  (people.members || []).forEach((m, i) => {
    const who = `members[${i + 1}] ${m?.name ?? ""}`.trim();
    if (!m || typeof m !== "object") return err("members.yml", `${who}: 항목 형식이 잘못되었습니다.`);
    if (!m.id) err("members.yml", `${who}: id 가 없습니다.`);
    else if (!/^[a-z0-9-]+$/.test(m.id)) err("members.yml", `${who}: id "${m.id}" 는 영문 소문자/숫자/하이픈만 쓸 수 있습니다.`);
    else if (seen.has(m.id)) err("members.yml", `${who}: id "${m.id}" 가 중복됩니다.`);
    seen.add(m.id);
    if (!m.name) err("members.yml", `${who}: name 이 없습니다.`);
    if (!roleKeys.includes(m.role)) err("members.yml", `${who}: role "${m.role}" 은(는) roles.yml 에 없습니다. 가능한 값: ${roleKeys.join(", ")}`);
    if (m.track && !TRACKS.includes(m.track)) err("members.yml", `${who}: track 은 ${TRACKS.join(" | ")} 중 하나여야 합니다.`);
    if (m.status && !STATUSES.includes(m.status)) err("members.yml", `${who}: status 는 current | alumni 중 하나여야 합니다.`);
    if (m.photo && !fs.existsSync(path.join(PHOTOS, m.photo))) err("members.yml", `${who}: 사진 파일이 없습니다: ${PHOTOS}/${m.photo} (파일명 대소문자도 확인)`);
    if (m.pub_names && !Array.isArray(m.pub_names)) err("members.yml", `${who}: pub_names 는 ["Lee J", "Lee JW"] 처럼 목록이어야 합니다.`);
    if (m.status === "alumni" && !m.left) warn("members.yml", `${who}: 졸업/퇴직 연도(left)가 없습니다.`);
  });
}

// ---- publications ----
const pubs = load("publications.yml");
if (pubs) {
  if (!Array.isArray(pubs)) err("publications.yml", "파일 전체가 '- title: ...' 로 시작하는 목록이어야 합니다.");
  else {
    const pmids = new Map();
    const dois = new Map();
    pubs.forEach((p, i) => {
      const where = `#${i + 1} "${String(p?.title ?? "").slice(0, 50)}"`;
      if (!p?.title) err("publications.yml", `${where}: title 이 없습니다.`);
      if (!Array.isArray(p?.authors) || !p.authors.length) err("publications.yml", `${where}: authors 는 ["Kim Y", "Lee J"] 형식의 목록이어야 합니다.`);
      if (!p?.journal) err("publications.yml", `${where}: journal 이 없습니다.`);
      if (p?.year !== undefined && !/^\d{4}$/.test(String(p.year))) err("publications.yml", `${where}: year 는 4자리 숫자여야 합니다.`);
      if (!p?.year) warn("publications.yml", `${where}: year 가 없어 "In press" 로 표시됩니다.`);
      if (p?.unbold && !Array.isArray(p.unbold)) err("publications.yml", `${where}: unbold 는 ["Kim H"] 처럼 목록이어야 합니다.`);
      if (p?.pmid) {
        const k = String(p.pmid);
        if (pmids.has(k)) err("publications.yml", `${where}: PMID ${k} 가 #${pmids.get(k)} 와 중복됩니다.`);
        pmids.set(k, i + 1);
      }
      if (p?.doi) {
        const k = String(p.doi).toLowerCase();
        if (/^https?:/.test(k)) err("publications.yml", `${where}: doi 에는 주소 없이 "10.xxxx/..." 부분만 적어 주세요.`);
        if (dois.has(k)) err("publications.yml", `${where}: DOI 가 #${dois.get(k)} 와 중복됩니다.`);
        dois.set(k, i + 1);
      }
    });
  }
}

// ---- research / join / site ----
const research = load("research.yml");
const ILLUS = fs.readdirSync("src/_includes/illustrations").map((f) => f.replace(/\.njk$/, ""));
const checkVisual = (item, where) => {
  if (!item) return;
  if (item.illustration && !ILLUS.includes(item.illustration))
    err("research.yml", `${where}: illustration "${item.illustration}" 은(는) 없습니다. 가능한 값: ${ILLUS.join(", ")}`);
  for (const key of ["image", "video"])
    if (item[key] && !fs.existsSync(path.join("src/assets/img/research", item[key])))
      err("research.yml", `${where}: ${key} 파일이 없습니다: src/assets/img/research/${item[key]}`);
};
(research?.themes || []).forEach((t, i) => {
  if (t.track && !TRACKS.includes(t.track)) err("research.yml", `themes[${i + 1}] track 은 ${TRACKS.join(" | ")} 중 하나여야 합니다.`);
  checkVisual(t, `themes[${i + 1}] ${t.title ?? ""}`);
});
checkVisual(research?.dry_lab, "dry_lab");
checkVisual(research?.wet_lab, "wet_lab");
load("join.yml");
const site = load("site.yml");
if (site && !site.lab_name) err("site.yml", "lab_name 이 비어 있습니다.");

// ---- report ----
warnings.forEach((w) => console.warn(w));
if (errors.length) {
  console.error(`\n데이터 파일에서 ${errors.length}개의 문제를 찾았습니다:\n`);
  errors.forEach((e) => console.error(e));
  console.error("\n위 문제를 고친 뒤 다시 저장(commit)하면 사이트가 자동으로 다시 만들어집니다.");
  process.exit(1);
}
console.log(`✓ 데이터 확인 완료 — members ${people?.members?.length ?? 0}, publications ${pubs?.length ?? 0}`);
