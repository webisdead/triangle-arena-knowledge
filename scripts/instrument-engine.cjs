// Read-only telemetry around the archived public engine. Fail closed if anchors change.
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'vendor/engine.cjs');
let source=fs.readFileSync(filename,'utf8');
function insert(needle,replacement){if(source.split(needle).length!==2)throw Error('Engine telemetry anchor changed');source=source.replace(needle,replacement);}
insert('function j(e, t) {','function j(e, t) {\n  e.observe?.("phaseStart", { active: t });');
insert('    !(function (e, t) {\n      let l = t.flatMap', '    e.observe?.("movement", { active: t, targets: l, moved: d });\n    !(function (e, t) {\n      let l = t.flatMap');
insert('      let n = l.filter((e) => "purge" === e.kind),','      e.observe?.("powerEffects", { pickups: l });\n      let n = l.filter((e) => "purge" === e.kind),');
insert('      for (let t of o) w(e, t, -1);','      e.observe?.("beforePurge", { pickups: n });\n      for (let t of o) w(e, t, -1);');
insert('  })(e, t, l);\n}', '  })(e, t, l);\n  e.observe?.("phaseEnd", {});\n}');
const instrumented=new Module(filename,module);instrumented.filename=filename;instrumented._compile(source,filename);
module.exports=instrumented.exports;
