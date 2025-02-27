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

  replaceVariables(content, context) {
    return content.replace(/{{\s*([^}]+)\s*}}/g, (match, path) => {
      // Split by . to handle nested properties
      const parts = path.trim().split(".");
      let value = context;

      for (const part of parts) {
        if (value === undefined || value === null) return "";
        value = value[part];
      }

      return value !== undefined ? value : "";
    });
  }

  processForLoops(template, data) {
    // Use a regex that captures everything between for and endfor
    const forLoopRegex =
      /{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g;

    let result = template;
    let match;

    // Use an iterative approach to handle nested loops
    while ((match = forLoopRegex.exec(template)) !== null) {
      const [fullMatch, itemVar, arrayVar, content] = match;

      if (!data[arrayVar] || !Array.isArray(data[arrayVar])) {
        // Replace the for loop with empty string if array doesn't exist
        result = result.replace(fullMatch, "");
        continue;
      }

      let loopResult = "";

      // Process each item in the array
      for (const item of data[arrayVar]) {
        // Create a context with the loop variable
        const loopContext = { ...data, [itemVar]: item };

        // Replace variables in the content
        let itemContent = this.replaceVariables(content, loopContext);

        // Add processed content to the result
        loopResult += itemContent;
      }

      // Replace the for loop with processed content
      result = result.replace(fullMatch, loopResult);
    }

    return result;
  }

  render(template, data) {
    // First process any for loops
    let result = this.processForLoops(template, data);

    // Then replace any remaining variables
    result = this.replaceVariables(result, data);

    return result;
  }

  renderWithIncludes(template, data) {
    return template.replace(/{%\s*include\s*"(.*?)"\s*%}/g, (match, file) => {
      const partial = this.loadTemplate(file);
      return partial; // Don't render the partial yet, just include it
    });
  }

  renderPage(templateFile, dataFile) {
    const template = this.loadTemplate(templateFile);
    const data = this.loadData(dataFile);
    const withIncludes = this.renderWithIncludes(template, data);
    return this.render(withIncludes, data);
  }

  renderAll() {
    fs.readdirSync(this.templateDir).forEach((file) => {
      if (file.endsWith(".liquid") && !file.includes(path.sep)) {
        // Skip files in subdirectories to avoid processing partials
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
