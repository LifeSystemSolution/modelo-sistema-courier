export const COMPANY_NAME = "LifeCargo Express S.A.C.";
export const COMPANY_RUC = "20000000000";
export const SYSTEM_NAME = "Sistema de Gestión de Envíos";
export const APP_TITLE = `${COMPANY_NAME} | ${SYSTEM_NAME}`;
export const LOGO_PATH = "assets/logo/logo.png";
export const LOGO_SVG = "assets/logo/logo.svg";
export const LOGO_PLACEHOLDER = "assets/logo/placeholder.svg";

export function logoImg(className = "app-logo", alt = "Logo LifeCargo Express S.A.C.") {
  return `<img src="${LOGO_PATH}" onerror="this.onerror=function(){this.onerror=null;this.src='${LOGO_PLACEHOLDER}';};this.src='${LOGO_SVG}';" class="${className}" alt="${alt}">`;
}

export function brandHeader(className = "brand-header") {
  return `
    <div class="${className}">
      ${logoImg("brand-logo")}
      <div class="brand-company">${COMPANY_NAME}</div>
      <div class="brand-ruc">RUC: ${COMPANY_RUC}</div>
      <div class="brand-system">${SYSTEM_NAME}</div>
    </div>`;
}

export function printHeader(className = "print-brand") {
  return `
    <header class="${className}">
      ${logoImg("print-logo")}
      <div>
        <h2>${COMPANY_NAME}</h2>
        <p>RUC: ${COMPANY_RUC}</p>
        <p>${SYSTEM_NAME}</p>
      </div>
    </header>`;
}

export function printTimestamp() {
  return new Date().toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

export function ensureBrandLogos() {
  document.title = APP_TITLE;
  document.querySelectorAll(".brand").forEach((brand) => {
    brand.outerHTML = brandHeader();
  });
}

document.addEventListener("DOMContentLoaded", ensureBrandLogos);
