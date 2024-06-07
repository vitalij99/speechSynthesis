const fs = require("fs");
const path = require("path");
const uglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");

const minifyFiles = (inputDir, outputDir, extension, minifyFunction) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Помилка при читанні папки ${inputDir}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(inputDir, file);

      if (path.extname(file) === extension) {
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error(`Помилка при читанні файлу ${filePath}:`, err);
            return;
          }

          const result = minifyFunction(data);

          if (result.error) {
            console.error(
              `Помилка при мінімізації файлу ${filePath}:`,
              result.error
            );
            return;
          }

          const outputFilePath = path.join(outputDir, file);

          fs.writeFile(outputFilePath, result, "utf8", (err) => {
            if (err) {
              console.error(`Помилка при записі файлу ${outputFilePath}:`, err);
              return;
            }

            console.log(`Файл мінімізовано: ${file}`);
          });
        });
      }
    });
  });
};

const copyFiles = (inputDir, outputDir, extensions) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Помилка при читанні папки ${inputDir}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(inputDir, file);
      const fileExt = path.extname(file).toLowerCase();

      if (extensions.includes(fileExt)) {
        const outputFilePath = path.join(outputDir, file);
        fs.copyFile(filePath, outputFilePath, (err) => {
          if (err) {
            console.error(`Помилка при копіюванні файлу ${filePath}:`, err);
            return;
          }
          console.log(`Файл скопійовано: ${file}`);
        });
      }
    });
  });
};
const copyManifest = (inputFile, outputFile) => {
  fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
      console.error(`Помилка при читанні файлу ${inputFile}:`, err);
      return;
    }

    const minifiedData = JSON.stringify(JSON.parse(data));

    fs.writeFile(outputFile, minifiedData, "utf8", (err) => {
      if (err) {
        console.error(`Помилка при записі файлу ${outputFile}:`, err);
        return;
      }
      console.log(`Файл manifest.json мінімізовано і скопійовано`);
    });
  });
};
copyManifest(
  path.join(__dirname, "manifest.json"),
  path.join(__dirname, "build", "manifest.json")
);

copyFiles(path.join(__dirname, "img"), path.join(__dirname, "build", "img"), [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
]);

minifyFiles(
  path.join(__dirname, "js"),
  path.join(__dirname, "build", "js"),
  ".js",
  (data) => {
    const result = uglifyJS.minify(data);
    if (result.error) throw result.error;

    return result.code;
  }
);
minifyFiles(
  path.join(__dirname, "css"),
  path.join(__dirname, "build", "css"),
  ".css",
  (data) => {
    const result = new CleanCSS().minify(data);
    if (result.errors.length) throw result.errors;

    return result.styles;
  }
);

copyFiles(path.join(__dirname, "html"), path.join(__dirname, "build", "html"), [
  ".html",
]);
