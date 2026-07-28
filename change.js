import fs from "fs";

const input = "svg/SF Symbols/svg.json";
const output = "svg/SF Symbols/svg-clean.json";

const data = JSON.parse(fs.readFileSync(input, "utf8"));

function removeSize(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(removeSize);
    } else if (obj && typeof obj === "object") {
        delete obj.width;
        delete obj.height;

        for (const key in obj) {
            removeSize(obj[key]);
        }
    }
}

removeSize(data);

fs.writeFileSync(
    output,
    JSON.stringify(data, null, 2),
    "utf8"
);