const fs = require("fs");
const path = require("path");
const uglifyJS = require("uglify-js");

const inputDir = path.join(__dirname, "js");
const outputDir = path.join(__dirname, "build", "js");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error("An error occurred while reading the folder:", err);
    return;
  }
  console.log(files);
  files.forEach((file) => {
    const filePath = path.join(inputDir, file);

    if (path.extname(file) === ".js") {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error(
            "An error occurred while reading the file:",
            filePath,
            err
          );
          return;
        }

        const result = uglifyJS.minify(data);

        if (result.error) {
          console.error(
            "An error occurred while minimizing the file:",
            result.error
          );
          return;
        }

        const outputFilePath = path.join(outputDir, file);

        fs.writeFile(outputFilePath, result.code, "utf8", (err) => {
          if (err) {
            console.error("An error occurred while writing the file:", err);
            return;
          }

          console.log(`The file is minimized: ${file}`);
        });
      });
    }
  });
});
