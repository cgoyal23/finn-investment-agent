import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
let instance = 0;
const asUrl = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
export async function loadTs(entry, mocks = {}) {
  const memo = new Map(),
    unique = ++instance;
  function moduleUrl(filename) {
    const absolute = path.resolve(filename);
    if (memo.has(absolute)) return memo.get(absolute);
    if (absolute.endsWith(".json"))
      return asUrl("export default " + fs.readFileSync(absolute, "utf8"));
    let code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    code = code.replace(
      /\bfrom\s+(["'])([^"']+)\1/g,
      (all, quote, specifier) => {
        let url;
        if (Object.hasOwn(mocks, specifier)) url = asUrl(mocks[specifier]);
        else if (specifier.startsWith(".") || specifier.startsWith("@/")) {
          let target = specifier.startsWith("@/")
            ? path.resolve(specifier.slice(2))
            : path.resolve(path.dirname(absolute), specifier);
          if (!path.extname(target)) target += ".ts";
          url = moduleUrl(target);
        } else url = import.meta.resolve(specifier);
        return "from " + JSON.stringify(url);
      },
    );
    const result = asUrl(`// isolated test module ${unique}\n` + code);
    memo.set(absolute, result);
    return result;
  }
  return import(moduleUrl(entry));
}
