import { NextRequest, NextResponse } from "next/server";

// POST /api/ai/recommend
// Uses Google Gemini (free tier) to get maintenance recommendations, or falls back to a smart mock engine
export async function POST(req: NextRequest) {
  try {
    const {
      assetName,
      category,
      issueTitle,
      issueDescription,
      serviceHistory,
    } = await req.json();

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_KEY = GROQ_API_KEY || GEMINI_API_KEY;

    if (!API_KEY) {
      const fallbackText = getFallbackRecommendation(
        category,
        issueTitle,
        issueDescription,
      );
      return NextResponse.json(
        { success: true, recommendation: fallbackText, isMock: true },
        { status: 200 },
      );
    }

    const prompt = `You are a professional maintenance engineer AI assistant.

Asset: ${assetName}
Category: ${category}
Issue Title: ${issueTitle}
Issue Description: ${issueDescription}
Recent Service History: ${serviceHistory || "None"}

Please provide:
1. Root cause analysis (2-3 sentences)
2. Immediate action steps (3-5 bullet points)
3. Preventive maintenance recommendation (2-3 sentences)
4. Estimated resolution time
5. Priority level (low/medium/high/critical) with reasoning

Keep response concise and actionable for a maintenance technician.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No recommendation available.";

      return NextResponse.json(
        { success: true, recommendation: text },
        { status: 200 },
      );
    } catch (apiError) {
      console.warn("Gemini API call failed, using smart fallback:", apiError);
      const fallbackText = getFallbackRecommendation(
        category,
        issueTitle,
        issueDescription,
      );
      return NextResponse.json(
        { success: true, recommendation: fallbackText, isMock: true },
        { status: 200 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "AI recommendation failed", error },
      { status: 500 },
    );
  }
}

function getFallbackRecommendation(
  category: string,
  title: string,
  description: string,
): string {
  const cat = (category || "").toUpperCase();
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();

  let rootCause =
    "Initial analysis indicates potential component wear or electrical signal discrepancy.";
  let steps = [
    "Safety First: Disconnect the power supply or shut off the main valve if applicable.",
    "Visual Inspection: Check for loose wiring, structural damage, or physical blockages.",
    "Environmental Factors: Verify that the ambient operating temperature and ventilation are within normal ranges.",
  ];
  let preventive =
    "Schedule quarterly diagnostic inspections and clean filters/coils to prevent recurrences.";
  let time = "1-2 Hours";
  let priority = "Medium";

  if (cat === "HVAC") {
    if (
      t.includes("leak") ||
      d.includes("leak") ||
      t.includes("water") ||
      d.includes("water")
    ) {
      rootCause =
        "Condensate drain line is likely clogged with algae or debris, causing water backup and overflow in the tray.";
      steps = [
        "Safety First: Shut off the HVAC indoor unit's power breaker.",
        "Locate the condensate drain pipe (usually PVC near the cooling coil).",
        "Inspect the drain pan for standing water or overflowing leaks.",
        "Use a wet/dry shop vac or flushing pump to clear the pipe obstruction.",
        "Check and replace the air filter to reduce airflow resistance and humidity accumulation.",
      ];
      preventive =
        "Pour hot water with vinegar down the condensate line every 3 months and replace air filters monthly during peak seasons.";
      time = "45 - 60 Minutes";
      priority = "Medium";
    } else if (
      t.includes("cool") ||
      d.includes("cool") ||
      t.includes("heat") ||
      d.includes("heat") ||
      t.includes("blow") ||
      d.includes("blow")
    ) {
      rootCause =
        "Reduced thermal exchange, likely caused by dirty condenser coils, blocked ventilation vents, or low refrigerant level.";
      steps = [
        "Verify thermostat setpoints and check if the outdoor compressor fan is operational.",
        "Inspect the air filter; replace immediately if dirty or dusty.",
        "Ensure outdoor unit coils are clean and free from leaves, mud, or debris.",
        "Measure the temperature difference between supply and return air vents (should be 15-20°F).",
        "Call an HVAC specialist if temperature split is low, which suggests a refrigerant leakage.",
      ];
      preventive =
        "Clean condenser coils annually, check electrical contacts, and ensure the outdoor unit has at least 2 feet of clear space around it.";
      time = "1.5 - 2 Hours";
      priority = "High";
    }
  } else if (cat === "ELECTRICAL") {
    priority = "High";
    if (
      t.includes("spark") ||
      d.includes("spark") ||
      t.includes("smoke") ||
      d.includes("smoke") ||
      t.includes("burn") ||
      d.includes("burn")
    ) {
      priority = "Critical";
      rootCause =
        "Arcing due to loose terminal connections, overloaded circuit, or severe short circuit in the outlet/switch.";
      steps = [
        "CRITICAL: Shut off the main breaker immediately. Do not attempt to touch the outlet/switch.",
        "Use a non-contact voltage tester to verify the circuit is dead before proceeding.",
        "Examine the outlet/fixture for burn marks, melted insulation, or structural damage.",
        "Tighten electrical terminal screws or replace the damaged wiring harness/fixture entirely.",
        "Verify total current load on the circuit does not exceed breaker capacity (typically 15A or 20A).",
      ];
      preventive =
        "Conduct infrared thermography scans of electrical panels annually to detect hotspots and loose connections early.";
      time = "30 - 60 Minutes";
    } else {
      rootCause =
        "Intermittent power flow or tripped circuit breaker, possibly due to a ground fault or a faulty appliance load.";
      steps = [
        "Safety First: Avoid wet surfaces. Check the main distribution panel for tripped breakers.",
        "Reset the tripped breaker (flip fully to OFF, then turn back to ON).",
        "Unplug all devices on the affected line to isolate the source of the overload.",
        "Test outlets using a multimeter or GFCI tester to ensure correct hot/neutral/ground polarity.",
        "Inspect wiring if the breaker trips again immediately, indicating a short circuit.",
      ];
      preventive =
        "Balance phase loads on the distribution panel and replace breakers showing signs of mechanical weakness.";
      time = "30 - 45 Minutes";
    }
  } else if (cat === "PLUMBING") {
    if (
      t.includes("clog") ||
      d.includes("clog") ||
      t.includes("drain") ||
      d.includes("drain") ||
      t.includes("block") ||
      d.includes("block")
    ) {
      rootCause =
        "Accumulation of organic waste, hair, grease, or foreign objects obstructing the drain trap or main pipe line.";
      steps = [
        "Shut off the local water supply valve below the fixture to prevent overflow.",
        "Use a professional plunger or hand auger (snake) to physically clear the blockage.",
        "Remove and clean the P-trap to inspect for heavy grease build-up or solid objects.",
        "Flush the line with hot water. Avoid using harsh chemical cleaners which damage pipes.",
        "If multiple fixtures are clogged, inspect the main sewer cleanout.",
      ];
      preventive =
        "Install drain strainers to catch hair and debris, and never dump cooking grease or oil down any drain.";
      time = "30 - 60 Minutes";
      priority = "Medium";
    } else {
      rootCause =
        "Damaged pipe joint, worn washers, or high water pressure causing structural failure of fittings/seals.";
      steps = [
        "Locate and close the primary water isolation valve immediately to stop the leak.",
        "Dry the area completely to locate the exact source of the leak (joint, pipe body, or connection).",
        "Apply emergency pipe repair wrap or replace the damaged pipe section/fittings entirely.",
        "Inspect washers, O-rings, and thread tape; apply fresh Teflon tape where required.",
        "Slowly restore water pressure and inspect for any micro-leakage.",
      ];
      preventive =
        "Monitor building water pressure (keep between 40-60 PSI) and inspect exposed pipes annually for corrosion.";
      time = "1 - 2 Hours";
      priority = "High";
    }
  } else if (cat === "IT EQUIPMENT" || cat === "IT") {
    rootCause =
      "Operating system deadlock, software configuration issue, or overheating due to accumulated dust.";
    steps = [
      "Perform a hard reset by holding the power button or cycling the main power source.",
      "Check that all power cables, network connections (Ethernet/fiber), and peripherals are secure.",
      "Inspect cooling fans and exhaust vents; clean using compressed air if dust is present.",
      "Check server console logs, device manager, or networking logs for error flags.",
      "Update firmware, operating systems, and drivers to patch bugs causing resource leaks.",
    ];
    preventive =
      "Implement automated software updates, ensure clean/cool server environments, and perform monthly backup tests.";
    time = "30 - 90 Minutes";
    priority = "Low";
  }

  return `### 🤖 AI Maintenance Diagnostics

**1. Root Cause Analysis**
${rootCause}

**2. Immediate Action Steps**
${steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

**3. Preventive Maintenance Recommendation**
${preventive}

**4. Estimated Resolution Time**
⏱️ ${time}

**5. Recommended Ticket Details**
- **Priority:** ${priority} (Based on safety and operational impact factors)`;
}
