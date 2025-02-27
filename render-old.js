const fs = require("fs");
const path = require("path");

class LiquidRenderer {
  constructor(templateDir, dataDir) {
    this.templateDir = templateDir;
    this.dataDir = dataDir;
  }

  loadTemplate(file) {
    return fs.readFileSync(path.join(this.templateDir, file), "utf8");
  }

  loadData(file) {
    return JSON.parse(fs.readFileSync(path.join(this.dataDir, file), "utf8"));
  }

  render(template, data) {
    return template.replace(
      /{{\s*(\w+)\s*}}/g,
      (match, key) => data[key] || "",
    );
  }

  renderWithIncludes(template, data) {
    return template.replace(/{%\s*include\s*"(.*?)"\s*%}/g, (match, file) => {
      const partial = this.loadTemplate(`${file}`);
      return this.render(partial, data);
    });
  }

  renderPage(templateFile, dataFile) {
    let template = this.loadTemplate(templateFile);
    const data = this.loadData(dataFile);
    template = this.renderWithIncludes(template, data);
    return this.render(template, data);
  }
}

const renderer = new LiquidRenderer("templates", "data");
const output = renderer.renderPage("dashboard.liquid", "dashboard.json");
fs.writeFileSync(path.join("dist", "dashboard.html"), output);
console.log("Dashboard rendered successfully!");
