const fs = require("fs");
const path = require("path");

class LiquidRenderer {
  constructor(templateDir, dataDir, outputDir) {
    this.baseDir = process.cwd(); // Get current working directory
    this.templateDir = path.join(this.baseDir, templateDir);
    this.dataDir = path.join(this.baseDir, dataDir);
    this.outputDir = path.join(this.baseDir, outputDir);
  }

  loadTemplate(file) {
    const filePath = path.join(this.templateDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, "utf8");
  }

  loadData(file) {
    const filePath = path.join(this.dataDir, file);
    if (!fs.existsSync(filePath)) {
      return {}; // Return empty object if no data file exists
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  render(template, data) {
    return template.replace(
      /{{\s*(\w+)\s*}}/g,
      (match, key) => data[key] || "",
    );
  }
  /*
  renderWithIncludes(template, data) {
    return template.replace(/{%\s*include\s*"(.*?)"\s*%}/g, (match, file) => {
      const partial = this.loadTemplate(path.join("partials", file));
      return this.render(partial, data);
    });
  }
*/

  renderWithIncludes(template, data) {
    return template.replace(/{%\s*include\s*"(.*?)"\s*%}/g, (match, file) => {
      // Instead of adding "partials/" to the file path, use the path directly
      const partial = this.loadTemplate(file);
      return this.render(partial, data);
    });
  }
  renderPage(templateFile, dataFile) {
    const template = this.loadTemplate(templateFile);
    const data = this.loadData(dataFile);
    const processedTemplate = this.renderWithIncludes(template, data);
    return this.render(processedTemplate, data);
  }

  renderAll() {
    fs.readdirSync(this.templateDir).forEach((file) => {
      if (file.endsWith(".liquid")) {
        const templatePath = file;
        const dataFile = file.replace(".liquid", ".json");
        const outputFile = file.replace(".liquid", ".html");

        if (fs.existsSync(path.join(this.dataDir, dataFile))) {
          const output = this.renderPage(templatePath, dataFile);
          fs.writeFileSync(path.join(this.outputDir, outputFile), output);
          console.log(`${outputFile} rendered successfully!`);
        } else {
          console.warn(`No data file found for ${file}, skipping.`);
        }
      }
    });
  }
}

const renderer = new LiquidRenderer("templates", "data", "dist");
renderer.renderAll();
