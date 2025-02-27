const fs = require("fs");
const path = require("path");
const { Liquid } = require("liquidjs");

class LiquidRenderer {
  constructor(templateDir, dataDir, outputDir) {
    this.baseDir = process.cwd(); // Get current working directory
    this.templateDir = path.join(this.baseDir, templateDir);
    this.dataDir = path.join(this.baseDir, dataDir);
    this.outputDir = path.join(this.baseDir, outputDir);

    // Initialize LiquidJS engine
    this.engine = new Liquid({
      root: [this.templateDir], // Root directory for templates
      extname: ".liquid", // File extension for templates
      cache: false, // Disable cache during development
    });
  }

  loadData(file) {
    const filePath = path.join(this.dataDir, file);
    if (!fs.existsSync(filePath)) {
      return {}; // Return empty object if no data file exists
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  async renderPage(templateFile, dataFile) {
    const data = this.loadData(dataFile);
    try {
      // Use LiquidJS to render the template with data
      return await this.engine.renderFile(templateFile, data);
    } catch (error) {
      console.error(`Error rendering ${templateFile}:`, error);
      return `Error rendering template: ${error.message}`;
    }
  }

  async renderAll() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const files = fs.readdirSync(this.templateDir);
    for (const file of files) {
      if (file.endsWith(".liquid") && !file.includes(path.sep)) {
        // Skip files in subdirectories to avoid processing partials
        const templatePath = file;
        const dataFile = file.replace(".liquid", ".json");
        const outputFile = file.replace(".liquid", ".html");

        if (fs.existsSync(path.join(this.dataDir, dataFile))) {
          const output = await this.renderPage(templatePath, dataFile);
          fs.writeFileSync(path.join(this.outputDir, outputFile), output);
          console.log(`${outputFile} rendered successfully!`);
        } else {
          console.warn(`No data file found for ${file}, skipping.`);
        }
      }
    }
  }
}

// Create and run the renderer
const renderer = new LiquidRenderer("templates", "data", "dist");
renderer.renderAll().catch((error) => {
  console.error("Error rendering templates:", error);
});
