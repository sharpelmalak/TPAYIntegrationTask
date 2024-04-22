///////constants//////////////
// array of operator codes
const opcodes = ["60201", "60202"];
// merchant codes
const merchantPublicKey = "qTmCPw7W5W2S57gL0kwM";
const merchantPrivateKey = "cv6kWabwxYRUSPSia1nj";
//////////////////////

// subscriptionInfo object
let subscriptionInfo = {
  productCatalog: "IntegrationTask",
  productSku: "1",
  subscriptionPlanId: 2425,
  operatorCode: "60201",
  msisdn: "",
  customerAccountNumber: "",
  merchantTemplateKey: "",
};

// check Enriched and init Tpay
async function initTPAY(operatorCodeIndex) {
  try {
    //on page load or on operator selection changed
    if (!TPay.HeaderEnrichment.enriched()) {
      operatorCode = opcodes[operatorCodeIndex];
      TPay.HeaderEnrichment.init({ operatorCode });
    } else {
      TPay.HeaderEnrichment.operatorCode();
    }
  } catch (error) {
    throw new Error("Enriched Error:", error);
  }
}

// load and eval tpay js library
async function loadTpayJsLibrary() {
  try {
    const date = getCurrentUTCDate();
    const lang = "en";
    const securityCode = await calculateSecurityCode(
      date + lang,
      merchantPublicKey,
      merchantPrivateKey
    );
    const url = `http://lookup.tpay.me/idxml.ashx/v2/js?date=${date}&lang=${lang}&digest=${securityCode}`;
    const library = await loadScript(url);
    eval(library);
    initTPAY(0);
  } catch (error) {
    throw new Error("Error calculating security code:", error);
  }
}

// send sendFreeMT Message // problem
async function sendFreeMTMessage(
  signature,
  messageBody,
  operatorCode,
  subscriptionContractId
) {
  try {
    const url = "http://live.tpay.me/api/TPAY.svc/json/SendFreeMTMessage";
    const requestBody = {
      signature,
      messageBody,
      operatorCode,
      subscriptionContractId,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const responseData = await response.json();
    console.log("Response:", responseData);
  } catch (error) {
    console.error("Error sending free MT message:", error);
  }
}

async function callBack(status, refCode, contractDetails) {
  try {
    let msgBody = "Congratulations ! Subscription Confirmed Successfully";
    if (!status) {
      msgBody = "Failed to Subscripe";
      return;
    } else if (status && refCode == null) {
      msgBody = "Subscription Contract Created and Pending Verification";
    }
    showCongratulationMessage(msgBody);
    const signature = await calculateSecurityCode(
      msgBody +
        subscriptionInfo.operatorCode +
        contractDetails.subscriptionContractId,
      merchantPublicKey,
      merchantPrivateKey
    );
    sendFreeMTMessage(
      signature,
      msgBody,
      subscriptionInfo.operatorCode,
      contractDetails.subscriptionContractId
    );
  } catch (error) {
    throw new Error("Call Back Error:", error);
  }
}

// on submit call confirmTPAY
document
  .getElementById("myForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    subscriptionInfo.msisdn = e.target.phone.value;
    subscriptionInfo.operatorCode = opcodes[e.target.selected.value];
    TPay.HeaderEnrichment.confirm(subscriptionInfo, callBack);
  });

//////HELPERS/////////////////

function getCurrentUTCDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`;
}

async function loadScript(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.text();
  } catch (error) {
    console.error("Error loading script:", error);
  }
}

function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  const params = {};
  for (const [key, value] of queryParams) {
    params[key] = value;
  }
  return params;
}
async function calculateSecurityCode(
  message,
  merchantPublicKey,
  merchantPrivateKey
) {
  // Convert the private key to a Uint8Array
  const privateKeyBytes = new TextEncoder().encode(merchantPrivateKey);

  try {
    // Import the private key for HMAC-SHA256
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      privateKeyBytes,
      { name: "HMAC", hash: { name: "SHA-256" } },
      true,
      ["sign"]
    );

    // Calculate the HMAC-SHA256 hash of the message using the merchant private key
    const signature = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode(message)
    );

    // Convert the signature bytes to a hexadecimal string
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // Concatenate the merchant public key with ":" and the hexadecimal string
    const securityCode = `${merchantPublicKey}:${signatureHex}`;
    return securityCode;
  } catch (error) {
    throw new Error("Error calculating security code:", error);
  }
}

function showCongratulationMessage(modalMessage) {
  var modal = document.getElementById("myModal");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  modal.style.display = "block";

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
  const modalMessageElement = document.getElementById("modalMessage");
  modalMessageElement.textContent = modalMessage;
}
