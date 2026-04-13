import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Scrape BCV website for USD rate
    const bcvResponse = await fetch("https://www.bcv.org.ve/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!bcvResponse.ok) {
      throw new Error(`BCV fetch failed: ${bcvResponse.status}`);
    }

    const html = await bcvResponse.text();

    // Extract USD rate from BCV page
    // The BCV page shows rates in a div with id="dolar"
    const usdMatch = html.match(
      /id="dolar"[^>]*>[\s\S]*?<strong>([\d,.]+)<\/strong>/i
    );

    let rate: number;
    if (usdMatch) {
      // BCV uses comma as decimal separator
      rate = parseFloat(usdMatch[1].replace(".", "").replace(",", "."));
    } else {
      // Try alternative pattern
      const altMatch = html.match(
        /USD[\s\S]*?<strong>([\d,.]+)<\/strong>/i
      );
      if (altMatch) {
        rate = parseFloat(altMatch[1].replace(".", "").replace(",", "."));
      } else {
        throw new Error("Could not parse BCV rate from page");
      }
    }

    if (isNaN(rate) || rate <= 0) {
      throw new Error(`Invalid rate parsed: ${rate}`);
    }

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("exchange_rates").upsert(
      {
        rate,
        source: "BCV",
        rate_date: today,
      },
      { onConflict: "source,rate_date" }
    );

    if (error) {
      throw new Error(`DB error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, rate, date: today }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error fetching BCV rate:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
