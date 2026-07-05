import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, invoiceNumber, items, customerName, customerEmail, callbackUrl } = await req.json();

    // Check credentials in environment variables
    const clientId = Deno.env.get("DOKU_CLIENT_ID") || "BRN-0205-1782556421062";
    const secretKey = Deno.env.get("DOKU_SECRET_KEY") || "SK-7HUyW8Pf2XCUziNSzwFO";
    const apiKey = Deno.env.get("DOKU_API_KEY") || "doku_key_920ce86bfa5640f9827a65c5c2f337fc";
    const isProd = Deno.env.get("DOKU_ENVIRONMENT") === "production";

    const dokuBaseUrl = isProd ? "https://api.doku.com" : "https://api-sandbox.doku.com";
    const requestTarget = "/checkout/v1/payment";

    // 1. Prepare request body for DOKU
    const requestBody = {
      order: {
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        amount: amount,
        currency: "IDR",
        callback_url: callbackUrl || "https://inrising-web.vercel.app/payment-callback",
        line_items: items || [
          {
            name: "InTracker Premium Plan",
            price: amount,
            quantity: 1
          }
        ]
      },
      payment: {
        payment_due_date: 60
      },
      customer: {
        name: customerName || "InTracker User",
        email: customerEmail || "user@intracker.co"
      }
    };

    const bodyString = JSON.stringify(requestBody);

    // 2. Generate Request-Id, Request-Timestamp, and Digest
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z"; // Format YYYY-MM-DDTHH:mm:ssZ

    const bodyBytes = new TextEncoder().encode(bodyString);
    const bodyHash = await crypto.subtle.digest("SHA-256", bodyBytes);
    const digest = base64Encode(bodyHash);

    // 3. Construct raw signature component string
    const rawSignatureString = 
      `Client-Id:${clientId}\n` +
      `Request-Id:${requestId}\n` +
      `Request-Timestamp:${requestTimestamp}\n` +
      `Request-Target:${requestTarget}\n` +
      `Digest:${digest}`;

    // 4. Calculate HMAC-SHA256 signature
    const keyBytes = new TextEncoder().encode(secretKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(rawSignatureString)
    );
    const signatureValue = base64Encode(signatureBytes);
    const signatureHeader = `HMACSHA256=${signatureValue}`;

    // 5. Send POST request to DOKU Checkout API
    const response = await fetch(`${dokuBaseUrl}${requestTarget}`, {
      method: "POST",
      headers: {
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        "Signature": signatureHeader,
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: bodyString
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Doku Edge Function Error]:", responseData);
      return new Response(JSON.stringify({ error: responseData }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[Checkout Serve Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
