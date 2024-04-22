// function to fetch json config
async function readLocalJSONFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return null;
  }
}
// function to get Date in UTC
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
// function to load and evaluate script from response
async function loadScript(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const scriptText = await response.text();
    return scriptText;
  } catch (error) {
    console.error("Error loading script:", error);
  }
}

// function that calculate encrypted HMACSHA256
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
export {
  readLocalJSONFile,
  loadScript,
  calculateSecurityCode,
  getCurrentUTCDate,
};


