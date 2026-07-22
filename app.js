
"use strict";

window.MyBloodApp = (() => {
  const FIREBASE_URL =
    "https://lebanonbloodcategoryproject.firebaseio.com";

  const REQUEST_TIMEOUT_MS = 15000;

  function createTimeoutController(timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return {
      controller,
      stop() {
        clearTimeout(timeoutId);
      }
    };
  }

  async function request(path, options = {}) {
    const timeout = createTimeoutController();

    try {
      const response = await fetch(
        FIREBASE_URL + path,
        {
          cache: "no-store",
          ...options,
          signal: timeout.controller.signal
        }
      );

      if (!response.ok) {
        throw new Error("Firebase HTTP " + response.status);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Firebase request timed out.");
      }

      throw error;
    } finally {
      timeout.stop();
    }
  }

  async function getPersons() {
    return await request("/Persons.json");
  }

  async function addPerson(person) {
    return await request("/Persons.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(person)
    });
  }

  async function addContactRequest(contactRequest) {
    return await request("/ContactRequests.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contactRequest)
    });
  }

  async function getFirstAvailableNode(nodeNames) {
    for (const nodeName of nodeNames) {
      try {
        const data = await request("/" + nodeName + ".json");

        if (data && Object.keys(data).length) {
          return {
            nodeName,
            data
          };
        }
      } catch (_) {
        // Continue checking the next compatible Firebase node.
      }
    }

    return {
      nodeName: null,
      data: null
    };
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase();
  }

  function cleanPhone(value) {
    return String(value || "")
      .trim()
      .replace(/[^\d+]/g, "");
  }

  function isValidLebanonPhone(value) {
    const phone = cleanPhone(value);
    const digits = phone.replace(/\D/g, "");

    return digits.length >= 7 && digits.length <= 15;
  }

  function normalizeLebanonPhone(value) {
    let digits = String(value || "").replace(/\D/g, "");

    if (digits.startsWith("00961")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("961")) {
      return digits;
    }

    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    return "961" + digits;
  }

  function shuffle(array) {
    const copy = [...array];

    for (let index = copy.length - 1; index > 0; index--) {
      const randomIndex =
        Math.floor(Math.random() * (index + 1));

      [copy[index], copy[randomIndex]] =
        [copy[randomIndex], copy[index]];
    }

    return copy;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setButtonLoading(button, isLoading, loadingText) {
    if (!button) {
      return;
    }

    if (isLoading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = loadingText;
      return;
    }

    button.disabled = false;

    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }

  function showMessage(element, type, text) {
    if (!element) {
      return;
    }

    element.className = "message " + type;
    element.textContent = text;
  }

  return {
    FIREBASE_URL,
    request,
    getPersons,
    addPerson,
    addContactRequest,
    getFirstAvailableNode,
    normalizeText,
    cleanPhone,
    isValidLebanonPhone,
    normalizeLebanonPhone,
    shuffle,
    escapeHtml,
    setButtonLoading,
    showMessage
  };
})();
