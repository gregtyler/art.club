import fs from "fs/promises";
import { generate } from "./generate.mjs";

(async () => {
  const resp = await generate();

  const painting = resp.results.bindings[0];

  const linkify = (obj, type) => {
    const label = obj[type];
    const link = obj[type.replace("Label", "Link")];

    return link ? `<a href="${link.value}">${label.value}</a>` : label.value;
  };

  const listDisplay = (list, type) => {
    const items = [...new Set(list.map((x, i) => linkify(x, type)))];
    if (items.length < 2) return items[0];

    if (items.length === 2) {
      return `${items[0]} and ${items[1]}`;
    }

    const rest = items.slice(0, -2);
    const ult = items.pop();
    const pen = items.pop();
    return `${rest.join(", ")}, ${pen} and ${ult}`;
  };

  const template = `

  <div class="header">
    <h1>${painting.paintingLabel.value}</h1>
    <h2>By ${linkify(painting, "creatorLabel")}</h2>
    ${
      painting.locationLabel?.value
        ? `<p>Find it at ${linkify(painting, "locationLabel")} or <a href="${
            painting.paintingLink.value
          }">read about it on Wikipedia</a></p>`
        : `<p><a href="${painting.paintingLink.value}">Read about it on Wikipedia</a></p>`
    }
    <p>
      Painted in ${painting.created?.value?.substr(0, 4) || "<em>unknown</em>"}
      ${
        painting.materialLabel?.value
          ? `with ${listDisplay(resp.results.bindings, "materialLabel")}`
          : ""
      }
      ${
        painting.movementLabel?.value
          ? `as part of the ${listDisplay(
              resp.results.bindings,
              "movementLabel"
            )} movement`
          : ""
      }
    </p>
  </div>
  ${
    painting.subjectLabel?.value
      ? `<div class="footer"><p>Depicted: ${listDisplay(
          resp.results.bindings,
          "subjectLabel"
        )}</p></div>`
      : ""
  }
  <a class="image-container" href="${painting.image.value}">
    <img class="image" src="${painting.image.value}" alt="${
    painting.paintingLabel.value
  } by ${painting.creatorLabel.value}" />
  </a>`;

  const file = await fs.readFile("./index.html");
  fs.writeFile(
    "./public/index.html",
    file.toString().replace("{{ body }}", template)
  );
})();
