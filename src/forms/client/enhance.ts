/**
 * Progressive enhancement script for forms
 *
 * This script adds client-side UX improvements:
 * - Inline validation on blur
 * - Loading state on submit
 * - Clear errors on input
 *
 * Works without JavaScript (forms still submit normally).
 */

interface FormEnhanceOptions {
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  showLoadingState?: boolean;
}

function enhanceForms(options: FormEnhanceOptions = {}) {
  const { validateOnBlur = true, validateOnChange = true, showLoadingState = true } = options;

  document.querySelectorAll("form[data-enhanced='false']").forEach((form) => {
    const formEl = form as HTMLFormElement;
    formEl.setAttribute("data-enhanced", "true");

    // Add loading state on submit
    if (showLoadingState) {
      formEl.addEventListener("submit", () => {
        const submitBtn = formEl.querySelector("button[type='submit']") as HTMLButtonElement | null;
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.disabled = true;
          const loadingLabel = submitBtn.getAttribute("data-loading-label") ?? "Submitting...";
          submitBtn.setAttribute("data-original-label", submitBtn.innerHTML);
          submitBtn.innerHTML = `
            <span class="inline-flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              ${loadingLabel}
            </span>
          `;
        }
      });
    }

    // Add blur validation for immediate feedback
    if (validateOnBlur) {
      formEl.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("blur", () => {
          validateField(input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
        });
      });
    }

    // Clear errors on input change
    if (validateOnChange) {
      formEl.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("input", () => {
          clearFieldError(input as HTMLElement);
        });
      });
    }
  });
}

function validateField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  // Use HTML5 validation API as baseline
  if (!field.checkValidity()) {
    showFieldError(field, field.validationMessage);
    return false;
  }

  // Additional validation based on data attributes
  const minLength = field.getAttribute("minlength");
  if (minLength && field.value.length > 0 && field.value.length < parseInt(minLength)) {
    showFieldError(field, `Must be at least ${minLength} characters`);
    return false;
  }

  const pattern = field.getAttribute("pattern");
  if (pattern && field.value.length > 0 && !new RegExp(pattern).test(field.value)) {
    const message = field.getAttribute("data-pattern-message") ?? "Invalid format";
    showFieldError(field, message);
    return false;
  }

  clearFieldError(field);
  return true;
}

function showFieldError(field: HTMLElement, message: string) {
  field.setAttribute("aria-invalid", "true");
  field.classList.add("border-red-500", "focus:ring-red-500");
  field.classList.remove("border-gray-300", "focus:ring-blue-500");

  const errorId = `${field.id}-error`;
  let errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.id = errorId;
    errorEl.className = "mt-1 text-sm text-red-600";
    errorEl.setAttribute("role", "alert");
    field.parentNode?.appendChild(errorEl);
  }

  errorEl.textContent = message;
  field.setAttribute("aria-describedby", errorId);
}

function clearFieldError(field: HTMLElement) {
  field.removeAttribute("aria-invalid");
  field.classList.remove("border-red-500", "focus:ring-red-500");
  field.classList.add("border-gray-300", "focus:ring-blue-500");

  const errorId = `${field.id}-error`;
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.remove();
  }
  field.removeAttribute("aria-describedby");
}

// Auto-init when script loads
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => enhanceForms());
  } else {
    enhanceForms();
  }
}
