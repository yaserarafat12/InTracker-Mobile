import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();

    // 1. Get Doku headers for signature verification
    const clientId = req.headers.get("Client-Id");
    const requestId = req.headers.get("Request-Id");
    const requestTimestamp = req.headers.get("Request-Timestamp");
    const signatureHeader = req.headers.get("Signature") || "";
    
    console.log("[Doku Webhook received]:", {
      clientId,
      requestId,
      requestTimestamp,
      signatureHeader,
    });

    // Extract signature value (remove "HMACSHA256=" or "HMACSIGNATURE=" if present)
    const receivedSignature = signatureHeader.replace(/^HMACSHA256=/, "").replace(/^HMACSIGNATURE=/, "");

    const expectedClientId = Deno.env.get("DOKU_CLIENT_ID") || "BRN-0205-1782556421062";
    const secretKey = Deno.env.get("DOKU_SECRET_KEY") || "SK-7HUyW8Pf2XCUziNSzwFO";

    // 2. Validate Signature to guarantee authenticity
    const bodyBytes = new TextEncoder().encode(rawBody);
    const bodyHash = await crypto.subtle.digest("SHA-256", bodyBytes);
    const digest = base64Encode(bodyHash);

    // Request path for incoming webhook (typically "/functions/v1/doku-webhook")
    const requestTarget = new URL(req.url).pathname;

    const rawSignatureString = 
      `Client-Id:${clientId}\n` +
      `Request-Id:${requestId}\n` +
      `Request-Timestamp:${requestTimestamp}\n` +
      `Request-Target:${requestTarget}\n` +
      `Digest:${digest}`;

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
    const computedSignature = base64Encode(signatureBytes);

    if (computedSignature !== receivedSignature) {
      console.warn("[Webhook Signature Mismatch! Expected:", computedSignature, "Got:", receivedSignature);
      return new Response(JSON.stringify({ error: "Invalid Signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Process Webhook Payload
    const payload = JSON.parse(rawBody);
    const transactionStatus = payload.transaction?.status;
    const invoiceNumber = payload.order?.invoice_number;

    console.log(`[Doku Webhook Status]: Invoice ${invoiceNumber} status is ${transactionStatus}`);

    // If transaction is successful, grant Premium
    if (transactionStatus === "SUCCESS" && invoiceNumber) {
      // Invoice format: INV_{userId}_{planType}_{timestamp}
      const parts = invoiceNumber.split("_");
      
      if (parts.length >= 3) {
        const userId = parts[1];
        const planType = parts[2]; // "weekly" | "monthly" | "annual"

        console.log(`[Doku Webhook SUCCESS]: Granting pro status for user ${userId}, plan: ${planType}`);

        // Compute pro_until timestamp
        const now = new Date();
        if (planType === "weekly") {
          now.setDate(now.getDate() + 7);
        } else if (planType === "monthly") {
          now.setDate(now.getDate() + 30);
        } else if (planType === "annual") {
          now.setDate(now.getDate() + 365);
        } else {
          now.setDate(now.getDate() + 30); // Default fallback 30 days
        }

        const proUntil = now.toISOString();

        // 4. Update profiles table in Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
          .from("profiles")
          .update({
            is_pro: true,
            pro_until: proUntil
          })
          .eq("id", userId);

        if (error) {
          console.error("[Webhook DB Update Error]:", error);
          return new Response(JSON.stringify({ error: "Database update failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }

        console.log(`[Doku Webhook SUCCESS]: Successfully updated database for user ${userId}`);
      } else {
        console.warn("[Webhook warning]: Invoice number does not match expected format:", invoiceNumber);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[Webhook Serve Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
